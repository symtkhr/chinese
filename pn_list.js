const pn_list = {
  "#" : ["a", "ai", "an", "ang", "ao", "e", "en", "er", "ou", "wa", "wai", "wan", "wang", "wei", "wen", "weng", "wo", "wu"],
  "y" : ["a", "an", "ang", "ao", "e", "i", "in", "ing", "ong", "ou", "u", "uan", "ue", "un"],
  
  "b" : ["a", "ai", "an", "ang", "ao",      "ei", "en", "eng", "i", "ian", "iao", "ie", "in", "ing", "o",       "u"],
  "p" : ["a", "ai", "an", "ang", "ao",      "ei", "en", "eng", "i", "ian", "iao", "ie", "in", "ing", "o", "ou", "u"],
  "m" : ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "i", "ian", "iao", "ie", "in", "ing", "o", "ou", "u"],
  "f" : ["a", "an", "ang", "ei", "en", "eng", "o", "ou", "u"],

  "d" : ["a", "ai", "an", "ang", "ao", "e", "eng", "i", "ian", "iao", "ie", "ing", "iu", "ong", "ou", "u", "uan", "ui", "un", "uo"],
  "t" : ["a", "ai", "an", "ang", "ao", "e", "eng", "i", "an", "ian", "iao", "ie", "ing", "ong", "ou", "u", "uan", "ui", "un", "uo"],
  "l" : ["a", "ai", "an", "ang", "ao", "e", "ei", "eng", "i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iu", "ong", "ou", "u", "v", "uan", "ve", "un", "uo"],
  "n" : ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "i", "ian", "iang", "iao", "ie", "in", "ing", "iu", "ong", "u", "v", "uan", "uo"],

  "g" : ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "ong", "ou", "u", "ua", "uai", "uan", "uang", "ui", "un", "uo"],
  "h" : ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "ong", "ou", "u", "ua", "uai", "uan", "uang", "ui", "un", "uo"],
  "k" : ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "ong", "ou", "u", "ua", "uai", "uan", "uang", "ui", "un", "uo"],

  "j" : ["i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu", "u", "uan", "ue", "un"],
  "q" : ["i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu", "u", "uan", "ue", "un"],
  "x" : ["i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu", "u", "uan", "ue", "un"],
  
  "s" : ["a", "ai", "an", "ang", "ao", "e",       "en", "eng", "i", "ong", "ou", "u", "uan", "ui", "un", "uo"],  
  "c" : ["a", "ai", "an", "ang", "ao", "e",       "en", "eng", "i", "ong", "ou", "u", "uan", "ui", "un", "uo"],
  "z" : ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "i", "ong", "ou", "u", "uan", "ui", "un", "uo"], 
  "r" : [           "an", "ang", "ao", "e",       "en", "eng", "i", "ong", "ou", "u", "uan", "ui", "un", "uo"],
  
  "ch": ["a", "ai", "an", "ang", "ao", "e",       "en", "eng", "i", "ong", "ou", "u", "ua", "uai", "uan", "uang", "ui", "un", "uo"], 
  "sh": ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "i",        "ou", "u", "ua", "uai", "uan", "uang", "ui", "un", "uo"],
  "zh": ["a", "ai", "an", "ang", "ao", "e", "ei", "en", "eng", "i", "ong", "ou", "u", "ua", "uai", "uan", "uang", "ui", "un", "uo"]
};

const similarity_nest = [ "m-b-p-h-f", "b-h", "g-k-q-ch", "d-t", "n-r-zh-j-z-c-s-sh-x", "j-r-z", "zh-sh-z-s-x", "#-y" ];
