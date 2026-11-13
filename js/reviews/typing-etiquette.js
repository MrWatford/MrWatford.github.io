/* Professional Typing Etiquette study guide data (used by js/review-engine.js).
   Built from the topics on Mr. Watford's Typing Class Quiz, written with new example sentences. */
window.REVIEW = (function () {
  var TERMS = [
    ["Typing etiquette", "Typing in a clear, correct, and respectful way for school and work."],
    ["Proofreading", "Reading your work to find and fix mistakes before you turn it in."],
    ["Capital letter rules", "Capitalize the first word of a sentence, names of people and places, and the word I."],
    ["Proper noun", "The name of a specific person, place, or thing, like Sarah Johnson or Texas. Always capitalized."],
    ["End punctuation", "The mark that ends a sentence: a period . a question mark ? or an exclamation point !"],
    ["Complete sentence", "Has a subject and a verb, makes a whole thought, starts with a capital, and ends with punctuation."],
    ["Sentence fragment", "A piece of a sentence that is missing something, like \"Late for school.\""],
    ["Paragraph", "A group of sentences about one idea. Paragraphs keep ideas separate and clear."],
    ["Professional tone", "Writing that sounds respectful and polite, not silly, slangy, or dramatic."],
    ["Texting shortcuts", "Things like u, idk, lol, and emojis. Leave them out of professional typing."],
    ["Spaces after a period", "One space."],
    ["Shift key", "Hold it down to type a capital letter."],
    ["Enter key", "Starts a new line or a new paragraph."],
    ["Backspace", "Erases a mistake so you can fix it."],
    ["School fonts", "Simple, easy-to-read fonts like Arial or Times New Roman."],
    ["Quotation marks", "Go around someone's exact words. Put a comma before, a capital first word inside, and the period inside: Mom said, \"Time for dinner.\""]
  ];

  var MC = [
    ["Which word in a sentence must ALWAYS be capitalized?", ["The first word", "Every noun", "The word after a comma", "Every long word"], "The first word of every sentence gets a capital."],
    ["Which sentence is typed correctly?", ["We went to the library.", "we went to the library.", "We went to the library", "We Went to the library."], "Capital at the start, no extra capitals, period at the end."],
    ["What is the main reason to proofread?", ["To find and fix mistakes", "To type faster", "To make the paper longer", "To change the font"], "Proofreading catches mistakes before anyone else sees them."],
    ["How many spaces go after a period in professional typing?", ["One", "Two", "Zero", "Three"], "Use one space after a period."],
    ["Which of these shows good typing etiquette?", ["Clear sentences with correct grammar", "Slang and texting shortcuts", "No capitals or punctuation", "Typing fast and not fixing mistakes"], "Clear and correct is professional."],
    ["Which punctuation mark ends a question?", ["?", ".", "!", ","], "Questions end with a question mark."],
    ["Which question is typed correctly?", ["What time is lunch?", "what time is lunch?", "What time is lunch.", "What Time is lunch?"], "Capital first word, question mark at the end."],
    ["Which should you leave OUT of professional typing?", ["Texting shortcuts like \"u\" and \"idk\"", "Paragraphs", "Capital letters", "Correct spelling"], "Spell words out completely."],
    ["You spot a spelling mistake while you're typing. What should you do?", ["Fix it with Backspace or Delete", "Ignore it", "Start a whole new document", "Keep going and hope no one notices"], "Fix it right away."],
    ["Which fonts are best for school assignments?", ["Arial or Times New Roman", "Comic Sans", "Fancy script fonts", "Decorative bubble fonts"], "Simple fonts are easy to read."],
    ["Which name is typed correctly?", ["Sarah Johnson", "sarah johnson", "Sarah johnson", "sarah Johnson"], "First and last names both get capitals."],
    ["Why do we use paragraphs?", ["To separate ideas clearly", "To make the paper longer", "To add more spaces", "To type faster"], "Each paragraph holds one main idea."],
    ["What tone should professional typing have?", ["Respectful and polite", "Silly and casual", "Full of slang", "Overly dramatic"], "Write the way you'd speak to a teacher or boss."],
    ["What should you do right before you turn in typed work?", ["Proofread it one last time", "Change the font color", "Add extra words", "Make the font bigger"], "One last check catches mistakes."],
    ["Which key do you hold to type a capital letter?", ["Shift", "Enter", "Ctrl", "Space bar"], "Hold Shift and press the letter."],
    ["Which key starts a new paragraph?", ["Enter", "Shift", "Ctrl", "Space bar"], "Enter starts a new line. (Tab can indent the first line.)"],
    ["Which one is a COMPLETE sentence?", ["The dog chased the ball.", "Chasing the ball", "The dog in the yard", "chased the ball."], "It has a subject (the dog), a verb (chased), a capital, and a period."],
    ["What is the BEST reason to leave emojis out of professional typing?", ["They can make your meaning unclear", "They are hard to find", "They make the file too big", "Computers can't show them"], "A reader might not understand what an emoji means."],
    ["Which sentence uses quotation marks correctly?", ["Mom said, \"Clean your room.\"", "Mom said \"clean your room\".", "Mom said, Clean your room.", "Mom said \"Clean your room\""], "Comma before, capital inside, period inside the quotation marks."],
    ["Which of these would you NOT do while proofreading?", ["Change what your paper is about", "Check capital letters", "Check punctuation", "Fix spelling"], "Proofreading fixes mistakes. It doesn't change the topic."],
    ["Why does typing etiquette matter?", ["It makes your message clear and correct", "It makes typing slower", "It adds more words", "It confuses readers"], "Good etiquette helps people understand you."],
    ["Which sentence has correct capitalization and punctuation?", ["My brother and I play soccer.", "my brother and I play soccer.", "My brother and i play soccer.", "My brother and I play soccer"], "Capital first word, capital I, period at the end."]
  ];

  var TF = [
    ["Use one space after a period.", true, "One space is the professional rule."],
    ["Typing \"u\" instead of \"you\" is fine in a school email.", false, "Spell words out in professional typing."],
    ["Proofreading means finding and fixing mistakes before you turn in your work.", true, "Always proofread."],
    ["Every noun should start with a capital letter.", false, "Only proper nouns (names) and the first word get capitals."],
    ["A question should end with a period.", false, "Questions end with a question mark."],
    ["Emojis can make your meaning unclear.", true, "That's why we leave them out of professional typing."],
    ["Paragraphs help keep different ideas separate.", true, "One idea per paragraph."],
    ["Comic Sans is the best font for school assignments.", false, "Use Arial or Times New Roman."],
    ["The word I is always capitalized.", true, "Even in the middle of a sentence."],
    ["A complete sentence needs ending punctuation.", true, "Period, question mark, or exclamation point."]
  ];

  // [messy sentence, [accepted answers], tip]
  var FIX = [
    ["i like typing class", ["I like typing class."], "Capitalize the first word and the word I, and end with a period."],
    ["where is the library", ["Where is the library?"], "Questions start with a capital and end with a question mark."],
    ["my friend sarah lives in texas.", ["My friend Sarah lives in Texas."], "Names of people and places are always capitalized."],
    ["We finished our science project yesterday", ["We finished our science project yesterday."], "Every sentence needs ending punctuation."],
    ["can u help me with my homework?", ["Can you help me with my homework?"], "Spell out words. No texting shortcuts like u."],
    ["The game starts at noon.  Don't be late.", ["The game starts at noon. Don't be late."], "Use only ONE space after a period."],
    ["my teacher said, \"finish your work.\"", ["My teacher said, \"Finish your work.\""], "Capitalize the first word inside the quotation marks, and keep the period inside."],
    ["mr. watford teaches typing", ["Mr. Watford teaches typing."], "Capitalize titles and names, and end with a period."],
    ["dad and i went fishing on saturday.", ["Dad and I went fishing on Saturday."], "Capitalize the first word, the word I, and days of the week."],
    ["did you finish the reading.", ["Did you finish the reading?"], "It's a question, so it ends with a question mark."],
    ["We visited new york city last summer.", ["We visited New York City last summer."], "City names are proper nouns."],
    ["lol that was so funny", ["That was so funny.", "That was so funny!"], "Leave out texting words like lol, and add a capital and ending punctuation."]
  ];

  return { labels: { term: "Term", def: "Meaning" }, terms: TERMS, mc: MC, tf: TF, fix: FIX };
})();
