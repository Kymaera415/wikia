/**
 * Inscript regular expression rules table for Malayalam
 * @author Junaid P V ([[user:Junaidpv]])
 * @date 2010-09-08
 * License: GPLv3
 */
var rules = [
['`', '', 'ൊ'],
['~', '', 'ഒ'],
['_', '', 'ഃ'],
['=', '', 'ൃ'],
['\\+', '', 'ഋ'],
['\\\\', '', '\u200C'],
['q', '', 'ൗ'],
['Q', '', 'ഔ'],
['w', '', 'ൈ'],
['W', '', 'ഐ'],
['e', '', 'ാ'],
['E', '', 'ആ'],
['r', '', 'ീ'],
['R', '', 'ഈ'],
['t', '', 'ൂ'],
['T', '', 'ഊ'],
['y', '', 'ബ'],
['Y', '', 'ഭ'],
['u', '', 'ഹ'],
['U', '', 'ങ'],
['i', '', 'ഗ'],
['I', '', 'ഘ'],
['o', '', 'ദ'],
['O', '', 'ധ'],
['p', '', 'ജ'],
['P', '', 'ഝ'],
['\\[', '', 'ഡ'],
['\\{', '', 'ഢ'],
//['\\]', '', '\u200d'],
['ണ്\\]', '', 'ൺ'],
['ന്\\]', '', 'ൻ'],
['ര്\\]', '', 'ർ'],
['ല്\\]', '', 'ൽ'],
['ള്\\]', '', 'ൾ'],
['ക്\\]', '', 'ൿ'],
['\\}', '', 'ഞ'],
['a', '', 'ോ'],
['A', '', 'ഓ'],
['s', '', 'േ'],
['S', '', 'ഏ'],
['d', '', '്'],
['D', '', 'അ'],
['f', '', 'ി'],
['F', '', 'ഇ'],
['g', '', 'ു'],
['G', '', 'ഉ'],
['h', '', 'പ'],
['H', '', 'ഫ'],
['j', '', 'ര'],
['J', '', 'റ'],
['k', '', 'ക'],
['K', '', 'ഖ'],
['l', '', 'ത'],
['L', '', 'ഥ'],
[';', '', 'ച'],
[':', '', 'ഛ'],
['\'', '', 'ട'],
['"', '', 'ഠ'],
['z', '', 'െ'],
['Z', '', 'എ'],
['x', '', 'ം'],
['c', '', 'മ'],
['C', '', 'ണ'],
['v', '', 'ന'],
['b', '', 'വ'],
['B', '', 'ഴ'],
['n', '', 'ല'],
['N', '', 'ള'],
['m', '', 'സ'],
['M', '', 'ശ'],
['<', '', 'ഷ'],
['/', '', 'യ']
];

jQuery.narayam.addScheme( 'ml-inscript', {
	'namemsg': 'narayam-ml-inscript',
	'extended_keyboard': false,
	'lookbackLength': 2,
	'keyBufferLength': 0,
	'rules': rules
} );