const a = new ArrayBuffer(4)
const view = new DataView(a)
view.setInt8(0, 88)  // decimal 
view.setInt8(1, 0b1011000)  // binary
view.setInt8(2, 0x58)    // hex
view.setInt8(3, 0o130)    // octal
console.log(view)


// override 0th position:
view.setInt8(0, -1) 
// console.log(view.getInt8(0))  // -1  -> signed value
// console.log(view.getUint8(0))  // 255  -> Unsigned value

view.setUint8(1, -5)
// console.log(view.getInt8(1))   // -5
// console.log(view.getUint8(1))   // 251  (bin of 5 : 000 0101) --flip->  1111 1010 + 1 => 1111 1011 => 251

view.setInt8(2, 127)
// console.log(view.getInt8(2))   //  127 (in bin : 0111 1111 -> start with 0 do so, do not need to 2's complement)
// console.log(view.getUint8(2))    // 127

view.setInt8(3, 128)
console.log(view.getInt8(3)) //  -128  (bin code : 1000 0000 , start with 1 so sign is '-' --flip-> 0111 1111 +1 -> 10000000 -> -128 )
console.log(view.getUint8(3)) // 128