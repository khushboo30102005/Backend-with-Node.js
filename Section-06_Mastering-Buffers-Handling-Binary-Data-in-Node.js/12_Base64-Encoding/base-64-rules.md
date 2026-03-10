### Rules of base64 encoding:

1. At least 3bytes (24 bits) should be there to work with base64.
2. If 3bytes are not there then base64 encoding will add multiple zeros to fill remaining bits. This extended zeros (000000, if all zeros are placeholder) are replaced with '='.
3. Data should be in multiples of 3 bytes.

---

### Examples

1. **abc**

How btoa('abc) works:

1. convert string into binary using utf-8 encoding:

```
01100001 01100010 01100011
```

2. make group of 6-6 digits:

```
011000 010110 001001 100011
  Y      W     J        J       // matched from base64 table
```

-> `YWJj` final Answer

---

**2. ab** :

binary:

```
01100001 01100010 00000000  (add placeHolder to make 3's multiple)
```

group of 6-6 digits :

```
011000 010110 001000 000000
   Y     W      I       =
(if 000000 is placeholder so it will replaced with =)
```

-> `YWI=` final Answer

---

**3.a**

```
011000 010000 000000 000000
   Y      Q      =      =
```

-> `YQ==` final Answer

---

**4. abcd**

```
011000 010110 001001 100011 011001 000000  000000 000000
   Y     W      J      j      Z      A        =      =
```

-> `YWJjZA==` Final Answer in base64 String

```js
btoa('abcd'); //'YWJjZA=='   Encoded into ascii string (base64)
atob('YWJjZA=='); //'abcd'   decoded into normal string
```
