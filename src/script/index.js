/****************************************************************************
 * Copyright 2018 EPAM Systems
 * Modifications copyright (C) 2018 metaphacts GmbH
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************/

/* 
 * ===Changes metaphacts===
 *
 * 2018 Johannes Trame <jt@metaphacts.com>
 * - change module exports to ease integration
 */

import ketcherui from './ui/app';
import molfile from './chem/molfile';
import smiles from './chem/smiles';
/*
	import {ketcherui, smiles} from 'ketcher/dist/ketcher';
	
	// can be simply initalized, i.e. using a callback ref
	// https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
	ketcherui(element, {});

	console.log(smiles.stringify(window['_ui_editor'].struct(), {ignoreErrors: true }))
*/
module.exports = {ketcherui, molfile, smiles};
