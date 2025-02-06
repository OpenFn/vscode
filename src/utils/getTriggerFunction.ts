export function getTriggerFunction(word: string, pos: number) {
  const trigger = word[pos];
  return trigger === "("
    ? bracketTrigger(word, pos - 1)
    : commaTrigger(word, pos - 1);
}

function bracketTrigger(word: string, pos: number) {
  let px = pos;
  while (px >= 0 && isAlphanumeric(word[px])) px--;
  return { content: word.substring(px + 1, pos + 1), commas: 0 };
}

const openbr = ["(", "[", "{"];
const closebr = [")", "]", "}"];
function commaTrigger(word: string, pos: number) {
  let px = pos;
  let br = 0;
  let commas = 0;
  while (br !== 1 && px >= 0) {
    if (openbr.includes(word[px])) br++;
    else if (closebr.includes(word[px])) br--;
    else if (word[px] === "," && br === 0) commas++;
    px--;
  }
  const content =
    bracketTrigger(word, px).content + word.substring(px + 1, pos + 1);
  return {
    content,
    commas,
  };
}

function isAlphanumeric(char: string) {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) // a-z
  );
}
