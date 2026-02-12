#!/usr/bin/env node
import fs from 'node:fs/promises';
try {
  const file1Content = await fs.readFile(process.argv[2], 'utf-8');

  const wordsArr = file1Content.split(/[\W]/).filter((w) => w);

  const wordsCount = {};

  wordsArr.forEach((word) => {
    word = word.toLowerCase()
    if (word in wordsCount) {
      wordsCount[word] += 1;
    } else {
      wordsCount[word] = 1;
    }
  });
  let search = process.argv[3];
  search = search?.toLowerCase()
  if (search in wordsCount) {
    console.log(wordsCount[search]);
  } 
  else if(search === undefined){
    console.log(wordsCount)
  }
  else{
    console.log("Word not found...")
  }
} catch (error) {
  console.log('error: file not found');
}
 