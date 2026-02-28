const a = new ArrayBuffer(4)
const view = new DataView(a) 
view.setInt16(0, 260, true)   // write data as little Endian  => 04 01  
view.setInt16(2, 260)           // write data as Big Endian   => 01 04

// third argument is false by Default so it write and read data as Big Endian

// Reading data :
// console.log(view.getInt16(0, true))  // read as LE
// console.log(view.getInt16(2))  // read as BE
// console.log(a)

//  32 bit --> 

const b = new ArrayBuffer(8)
const view2 = new DataView(b) 

// view2.setInt32(0, 4957)
// view2.setInt32(4, 4957, true)

// console.log(view2.getInt32(0))
// console.log(view2.getInt32(4, true))

view2.setInt32(0,0x12345678)
console.log(view2.getInt32(0))
console.log(view2.getInt8(0))
console.log(view2.getInt16(0))



