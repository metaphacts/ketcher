var Box2Abs = require('../../util/box2abs');
var Set = require('../../util/set');
var Vec2 = require('../../util/vec2');
var util = require('../util');
var scale = require('../../util/scale');

var Struct = require('../../chem/struct');
var draw = require('../draw');

var ReDataSGroupData = require('./redatasgroupdata');
var ReObject = require('./reobject');

var tfx = util.tfx;

function ReSGroup(sgroup) {
	this.init('sgroup');

	this.item = sgroup;
}
ReSGroup.prototype = new ReObject();
ReSGroup.isSelectable = function () {
	return false;
};

ReSGroup.prototype.draw = function (remol, sgroup) {
	var render = remol.render;
	var set = render.paper.set();
	var inBonds = [],
		xBonds = [];
	var atomSet = Set.fromList(sgroup.atoms);
	Struct.SGroup.getCrossBonds(inBonds, xBonds, remol.molecule, atomSet);
	bracketPos(sgroup, render, remol.molecule, xBonds);
	var bb = sgroup.bracketBox;
	var d = sgroup.bracketDir;
	sgroup.areas = [bb];

	switch (sgroup.type) {
	case 'MUL':
		new SGroupdrawBrackets(set, render, sgroup, xBonds, atomSet, bb, d, sgroup.data.mul);
		break;
	case 'SRU':
		var connectivity = sgroup.data.connectivity || 'eu';
		if (connectivity == 'ht')
			connectivity = '';
		var subscript = sgroup.data.subscript || 'n';
		new SGroupdrawBrackets(set, render, sgroup, xBonds, atomSet, bb, d, subscript, connectivity);
		break;
	case 'SUP':
		new SGroupdrawBrackets(set, render, sgroup, xBonds, atomSet, bb, d, sgroup.data.name, null, { 'font-style': 'italic' });
		break;
	case 'GEN':
		new SGroupdrawBrackets(set, render, sgroup, xBonds, atomSet, bb, d);
		break;
	case 'DAT':
		set = drawGroupDat(remol, sgroup);
		break;
	default: break;
	}
	return set;
};

function SGroupdrawBrackets(set, render, sg, xbonds, atomSet, bb, d, lowerIndexText, upperIndexText, indexAttribute) { // eslint-disable-line max-params
	var brackets = getBracketParameters(render.ctab.molecule, xbonds, atomSet, bb, d, render, sg.id);
	var ir = -1;
	for (var i = 0; i < brackets.length; ++i) {
		var bracket = brackets[i];
		var path = draw.bracket(render.paper, scale.obj2scaled(bracket.d, render.options),
		                        scale.obj2scaled(bracket.n, render.options),
		                        scale.obj2scaled(bracket.c, render.options),
		                        bracket.w, bracket.h, render.options);
		set.push(path);
		if (ir < 0 || brackets[ir].d.x < bracket.d.x || (brackets[ir].d.x == bracket.d.x && brackets[ir].d.y > bracket.d.y))
			ir = i;
	}
	var bracketR = brackets[ir];
	function renderIndex(text, shift) {
		var indexPos = scale.obj2scaled(bracketR.c.addScaled(bracketR.n, shift * bracketR.h), render.options);
		var indexPath = render.paper.text(indexPos.x, indexPos.y, text)
			.attr({
				'font': render.options.font,
				'font-size': render.options.fontszsub
			});
		if (indexAttribute)
			indexPath.attr(indexAttribute);
		var indexBox = Box2Abs.fromRelBox(util.relBox(indexPath.getBBox()));
		var t = Math.max(Vec2.shiftRayBox(indexPos, bracketR.d.negated(), indexBox), 3) + 2;
		indexPath.translateAbs(t * bracketR.d.x, t * bracketR.d.y);
		set.push(indexPath);
	}
	if (lowerIndexText)
		renderIndex(lowerIndexText, 0.5);
	if (upperIndexText)
		renderIndex(upperIndexText, -0.5);
}

function showValue(paper, pos, sg, options) {
	var text = paper.text(pos.x, pos.y, sg.data.fieldValue)
		.attr({
			'font': options.font,
			'font-size': options.fontsz
		});
	var box = text.getBBox();
	var rect = paper.rect(box.x - 1, box.y - 1, box.width + 2, box.height + 2, 3, 3);
	rect = sg.selected ?
		rect.attr(options.selectionStyle) :
		rect.attr({ fill: '#fff', stroke: '#fff' });
	var st = paper.set();
	st.push(
		rect,
		text.toFront()
	);
	return st;
}

function drawGroupDat(remol, sgroup) { // eslint-disable-line max-statements
	var render = remol.render;
	var options = render.options;
	var paper = render.paper;
	var set = paper.set();
	var atoms = Struct.SGroup.getAtoms(remol, sgroup);
	var i;
	bracketPos(sgroup, render, remol.molecule);
	sgroup.areas = sgroup.bracketBox ? [sgroup.bracketBox] : [];
	if (sgroup.pp == null)
		// NB: we did not pass xbonds parameter to the backetPos method above,
		//  so the result will be in the regular coordinate system
		sgroup.pp = sgroup.bracketBox.p1.add(new Vec2(0.5, 0.5));
	var ps = sgroup.pp.scaled(options.scale);

	if (sgroup.data.attached) {
		for (i = 0; i < atoms.length; ++i) {
			var atom = remol.atoms.get(atoms[i]);
			var p = scale.obj2scaled(atom.a.pp, options);
			var bb = atom.visel.boundingBox;
			if (bb != null)
				p.x = Math.max(p.x, bb.p1.x);
			p.x += options.lineWidth; // shift a bit to the right
			var nameI = showValue(paper, p, sgroup, options);
			var boxI = util.relBox(nameI.getBBox());
			nameI.translateAbs(0.5 * boxI.width, -0.3 * boxI.height);
			set.push(nameI);
			var sboxI = Box2Abs.fromRelBox(util.relBox(nameI.getBBox()));
			sboxI = sboxI.transform(scale.scaled2obj, render.options);
			sgroup.areas.push(sboxI);
		}
	} else {
		var name = showValue(paper, ps, sgroup, options);
		var box = util.relBox(name.getBBox());
		name.translateAbs(0.5 * box.width, -0.5 * box.height);
		set.push(name);
		var sbox = Box2Abs.fromRelBox(util.relBox(name.getBBox()));
		sgroup.dataArea = sbox.transform(scale.scaled2obj, render.options);
		if (!remol.sgroupData.has(sgroup.id))
			remol.sgroupData.set(sgroup.id, new ReDataSGroupData(sgroup));
	}
	return set;
}

function bracketPos(sg, render, mol, xbonds) { // eslint-disable-line max-statements
	var atoms = sg.atoms;
	if (!xbonds || xbonds.length !== 2) {
		sg.bracketDir = new Vec2(1, 0);
	} else {
		var p1 = mol.bonds.get(xbonds[0]).getCenter(mol);
		var p2 = mol.bonds.get(xbonds[1]).getCenter(mol);
		sg.bracketDir = Vec2.diff(p2, p1).normalized();
	}
	var d = sg.bracketDir;

	var bb = null;
	var contentBoxes = [];
	atoms.forEach(function (aid) {
		var atom = mol.atoms.get(aid);
		var bba = render ? render.ctab.atoms.get(aid).visel.boundingBox : null;
		if (!bba) {
			var pos = new Vec2(atom.pp);
			var ext = new Vec2(0.05 * 3, 0.05 * 3);
			bba = new Box2Abs(pos, pos).extend(ext, ext);
		} else {
			bba = bba.translate((render.options.offset || new Vec2()).negated()).transform(scale.scaled2obj, render.options);
		}
		contentBoxes.push(bba);
	}, this);
	mol.sGroupForest.children.get(sg.id).forEach(function (sgid) {
		var bba = render.ctab.sgroups.get(sgid).visel.boundingBox;
		bba = bba.translate((render.options.offset || new Vec2()).negated()).transform(scale.scaled2obj, render.options);
		contentBoxes.push(bba);
	}, this);
	contentBoxes.forEach(function (bba) {
		var bbb = null;
		[bba.p0.x, bba.p1.x].forEach(function (x) {
			[bba.p0.y, bba.p1.y].forEach(function (y) {
				var v = new Vec2(x, y);
				var p = new Vec2(Vec2.dot(v, d), Vec2.dot(v, d.rotateSC(1, 0)));
				bbb = (bbb === null) ? new Box2Abs(p, p) : bbb.include(p);
			}, this);
		}, this);
		bb = (bb === null) ? bbb : Box2Abs.union(bb, bbb);
	}, this);
	var vext = new Vec2(0.2, 0.4);
	if (bb !== null) bb = bb.extend(vext, vext);
	sg.bracketBox = bb;
}

function getBracketParameters(mol, xbonds, atomSet, bb, d, render, id) { // eslint-disable-line max-params
	function BracketParams(c, d, w, h) {
		this.c = c;
		this.d = d;
		this.n = d.rotateSC(1, 0);
		this.w = w;
		this.h = h;
	}
	var brackets = [];
	var n = d.rotateSC(1, 0);
	if (xbonds.length < 2) {
		(function () {
			d = d || new Vec2(1, 0);
			n = n || d.rotateSC(1, 0);
			var bracketWidth = Math.min(0.25, bb.sz().x * 0.3);
			var cl = Vec2.lc2(d, bb.p0.x, n, 0.5 * (bb.p0.y + bb.p1.y));
			var cr = Vec2.lc2(d, bb.p1.x, n, 0.5 * (bb.p0.y + bb.p1.y));
			var bracketHeight = bb.sz().y;

			brackets.push(new BracketParams(cl, d.negated(), bracketWidth, bracketHeight), new BracketParams(cr, d, bracketWidth, bracketHeight));
		})();
	} else if (xbonds.length === 2) {
		(function () { // eslint-disable-line max-statements
			var b1 = mol.bonds.get(xbonds[0]);
			var b2 = mol.bonds.get(xbonds[1]);
			var cl0 = b1.getCenter(mol);
			var cr0 = b2.getCenter(mol);
			var tl = -1;
			var tr = -1;
			var tt = -1;
			var tb = -1;
			var cc = Vec2.centre(cl0, cr0);
			var dr = Vec2.diff(cr0, cl0).normalized();
			var dl = dr.negated();
			var dt = dr.rotateSC(1, 0);
			var db = dt.negated();

			mol.sGroupForest.children.get(id).forEach(function (sgid) {
				var bba = render.ctab.sgroups.get(sgid).visel.boundingBox;
				bba = bba.translate((render.options.offset || new Vec2()).negated()).transform(scale.scaled2obj, render.options);
				tl = Math.max(tl, Vec2.shiftRayBox(cl0, dl, bba));
				tr = Math.max(tr, Vec2.shiftRayBox(cr0, dr, bba));
				tt = Math.max(tt, Vec2.shiftRayBox(cc, dt, bba));
				tb = Math.max(tb, Vec2.shiftRayBox(cc, db, bba));
			}, this);
			tl = Math.max(tl + 0.2, 0);
			tr = Math.max(tr + 0.2, 0);
			tt = Math.max(Math.max(tt, tb) + 0.1, 0);
			var bracketWidth = 0.25;
			var bracketHeight = 1.5 + tt;
			brackets.push(new BracketParams(cl0.addScaled(dl, tl), dl, bracketWidth, bracketHeight),
				new BracketParams(cr0.addScaled(dr, tr), dr, bracketWidth, bracketHeight));
		})();
	} else {
		(function () {
			for (var i = 0; i < xbonds.length; ++i) {
				var b = mol.bonds.get(xbonds[i]);
				var c = b.getCenter(mol);
				var d = Set.contains(atomSet, b.begin) ? b.getDir(mol) : b.getDir(mol).negated();
				brackets.push(new BracketParams(c, d, 0.2, 1.0));
			}
		})();
	}
	return brackets;
}

ReSGroup.prototype.drawHighlight = function (render) { // eslint-disable-line max-statements
	var options = render.options;
	var paper = render.paper;
	var sg = this.item;
	var bb = sg.bracketBox.transform(scale.obj2scaled, options);
	var lw = options.lineWidth;
	var vext = new Vec2(lw * 4, lw * 6);
	bb = bb.extend(vext, vext);
	var d = sg.bracketDir,
		 n = d.rotateSC(1, 0);
	var a0 = Vec2.lc2(d, bb.p0.x, n, bb.p0.y);
	var a1 = Vec2.lc2(d, bb.p0.x, n, bb.p1.y);
	var b0 = Vec2.lc2(d, bb.p1.x, n, bb.p0.y);
	var b1 = Vec2.lc2(d, bb.p1.x, n, bb.p1.y);

	var set = paper.set();
	sg.highlighting = paper
		.path('M{0},{1}L{2},{3}L{4},{5}L{6},{7}L{0},{1}', tfx(a0.x), tfx(a0.y), tfx(a1.x), tfx(a1.y), tfx(b1.x), tfx(b1.y), tfx(b0.x), tfx(b0.y))
		.attr(options.highlightStyle);
	set.push(sg.highlighting);

	Struct.SGroup.getAtoms(render.ctab.molecule, sg).forEach(function (aid) {
		set.push(render.ctab.atoms.get(aid).makeHighlightPlate(render));
	}, this);
	Struct.SGroup.getBonds(render.ctab.molecule, sg).forEach(function (bid) {
		set.push(render.ctab.bonds.get(bid).makeHighlightPlate(render));
	}, this);
	render.ctab.addReObjectPath('highlighting', this.visel, set);
};

ReSGroup.prototype.show = function (restruct) {
	var render = restruct.render;
	var sgroup = this.item;
	if (sgroup.data.fieldName != "MRV_IMPLICIT_H") {
		var remol = render.ctab;
		var path = this.draw(remol, sgroup);
		restruct.addReObjectPath('data', this.visel, path, null, true);
		this.setHighlight(this.highlight, render); // TODO: fix this
	}
};

module.exports = ReSGroup;
