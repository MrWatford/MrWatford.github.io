/* Living Wisely Online study guide data (used by js/review-engine.js). Questions are reworded so the real quiz is never posted. */
window.REVIEW = (function () {
  var TERMS = [
    ["Netiquette", "Using good manners and polite rules when talking with people online."],
    ["Cyberbullying", "Using technology to hurt, threaten, or embarrass someone again and again."],
    ["Phishing", "A fake message or website that tries to trick you into giving away private information."],
    ["Plagiarism", "Copying someone else's words or work and calling it your own."],
    ["Personal information", "Private facts about you, like your address, phone number, and passwords."],
    ["Privacy settings", "Controls that decide who can see your posts and information."],
    ["AI chatbot", "A computer program that answers questions and creates writing or pictures."],
    ["Fact-checking", "Checking a claim with trustworthy sources to make sure it is true."],
    ["Digital footprint", "The trail of information you leave behind online (posts, pictures, comments, searches)."],
    ["Hallucination", "When an AI makes up a fact that sounds true but is false."],
    ["Deepfake", "A fake picture, video, or voice made with AI to look or sound like a real person."]
  ];
  var EXTRA_CARDS = [
    ["THINK", "Before you post or text, ask: Is it True? Helpful? Inspiring? Necessary? Kind?"]
  ];

  // Multiple choice: first choice listed is the right one (choices get shuffled).
  var MC = [
    ["Which of these is part of your digital footprint?", ["A comment you left under a video", "Muddy shoe prints on the classroom floor", "The size of your sneakers", "A dream you had last night"], "Your digital footprint is the trail you leave online: posts, pictures, comments, and searches."],
    ["In THINK, what does the H stand for?", ["Helpful", "Happy", "Honest", "Hidden"], "THINK = True, Helpful, Inspiring, Necessary, Kind."],
    ["In THINK, what does the N stand for?", ["Necessary", "Nice", "New", "Normal"], "THINK = True, Helpful, Inspiring, Necessary, Kind."],
    ["Which password is the strongest?", ["Maple-Canoe!82sunset", "ilovepizza", "12345678", "Your first and last name"], "Strong passwords are long and mix letters, numbers, and symbols."],
    ["Why is password123 a weak password?", ["It is short and easy to guess", "It has too many symbols", "It is too long to remember", "It uses capital letters"], "Weak passwords are easy to guess, like password123, 111111, or your name."],
    ["Someone you don't know in an online game asks which school you go to. What should you do?", ["Don't answer, block them, and tell a parent", "Tell them since it's only your school", "Give them a fake school name and keep chatting", "Ask them where they go first"], "Strangers online are not always who they say they are."],
    ["A group chat starts making fun of a classmate. What is the best choice?", ["Don't join in or share it, be kind to the classmate, and tell a trusted adult", "Add a laughing emoji so you fit in", "Screenshot it and send it to more friends", "Leave a mean comment about the people in the chat"], "Telling a trusted adult is not tattling; it helps keep people safe."],
    ["You send a friend a long message and they reply only \"ok.\" What should you do?", ["Don't assume the worst; kindly ask if everything is okay", "Reply in ALL CAPS so they know you're upset", "Stop talking to them", "Tell other friends they are being rude"], "Texts don't show tone of voice or faces, so they are easy to misunderstand."],
    ["An AI chatbot gives you a fact for your report. What should you do before using it?", ["Check it in a trustworthy source like a textbook or encyclopedia", "Nothing, because AI is always right", "Ask the same chatbot if it's sure", "Use it only if it sounds smart"], "AI can make mistakes. Fact-check it with trustworthy sources, more than one source, or a teacher or parent."],
    ["An AI tells you a president was born on the moon. What is this kind of AI mistake called?", ["A hallucination", "A deepfake", "Phishing", "Netiquette"], "A hallucination is when AI makes up a fact that sounds true but is false."],
    ["Which is a DISHONEST way to use AI?", ["Having AI write your book report and turning it in as yours", "Asking AI to explain a hard word, then writing the report yourself", "Asking your teacher if you may use AI", "Checking an AI answer in a textbook"], "Turning in AI work as if you wrote it is cheating."],
    ["Which is an HONEST way to use AI (with your teacher's permission)?", ["Asking AI to explain a math step you don't get, then doing the problems yourself", "Copying AI answers onto your homework", "Letting AI take an online quiz for you", "Having AI write your essay"], "Honest use: AI helps you understand, then you do the work."],
    ["A video shows a famous singer saying something shocking that doesn't sound like them. What might it be?", ["A deepfake", "A hallucination", "A privacy setting", "Plagiarism"], "Deepfakes are fake pictures, videos, or voices made with AI. Don't believe everything you see online."],
    ["An email says \"You won a free phone! Type your password to claim it.\" What is this?", ["Phishing", "Netiquette", "Fact-checking", "A digital footprint"], "Phishing tries to trick you into giving away private information."],
    ["Copying a paragraph from a website and turning it in as your own work is called…", ["Plagiarism", "Phishing", "Fact-checking", "Netiquette"], "Plagiarism is copying someone else's words or work and calling it your own."],
    ["What controls who can see your posts and information?", ["Privacy settings", "Netiquette", "A chatbot", "Fact-checking"], "Privacy settings decide who can see your posts."],
    ["Which of these is personal information you should keep private?", ["Your phone number", "Your favorite color", "The name of your favorite book", "What you think of a movie"], "Personal information includes your address, phone number, passwords, and school."],
    ["What does Ephesians 4:29 mean for how you act online?", ["Only post and text words that build others up", "It's okay to gossip if it's true", "Bad language is fine in private texts", "Only Sunday posts need to be kind"], "No gossip, insults, or bad language online."],
    ["Someone sends you an embarrassing picture of a classmate. What should you do?", ["Don't share it; delete it and tell a trusted adult", "Send it to just one friend", "Save it in case you need it later", "Post it, but without their name"], "Never pass along an embarrassing photo of someone else."]
  ];

  // True / false: [statement, answer, why]
  var TF = [
    ["If you delete a post right away, no one could have saved it.", false, "Posts last forever. Someone may already have taken a screenshot."],
    ["Strong passwords are long and mix letters, numbers, and symbols.", true, "Like Maple-Canoe!82sunset."],
    ["It's fine to share your password with a cousin you trust.", false, "Never share your password, not even with your best friend."],
    ["AI can make mistakes.", true, "AI is NOT always right, so fact-check it."],
    ["Typing in ALL CAPS is a polite way to show you're excited.", false, "ALL CAPS looks like you are shouting."],
    ["You can post a picture of your friends without asking them first.", false, "Ask permission before posting a photo of someone else."],
    ["Future employers might look at what you posted online.", true, "Schools and future employers may look at your digital footprint."],
    ["If the teacher can't see you, texting in class is okay.", false, "No texting during class, even if the teacher doesn't see you."],
    ["Telling a trusted adult about cyberbullying helps keep people safe.", true, "It is NOT tattling."],
    ["You should treat people online the same way you would face-to-face.", true, "Good netiquette = good manners online."],
    ["Someone online who says they are 12 years old is always telling the truth.", false, "Strangers online are not always who they say they are."],
    ["It's okay to tell an AI chatbot your home address.", false, "Never share personal information online or with an AI chatbot."],
    ["Using privacy settings is one way to keep your digital footprint positive.", true, "Also THINK first and post only kind, true things."]
  ];

  var SHORT = [
    ["What are TWO ways to check if something an AI told you is true?",
      "Look it up in a trustworthy source like a textbook or encyclopedia, and compare it with another source or ask a teacher or parent.",
      ["I named a trustworthy source (textbook, encyclopedia, reliable website)", "I gave a SECOND way (compare sources, or ask a teacher or parent)"]],
    ["What is a digital footprint? How can you keep yours positive?",
      "It is the trail of information you leave behind online. You can keep it positive by THINKing before you post and only sharing kind, true things.",
      ["I explained what a digital footprint is (the trail you leave online)", "I gave a way to keep it positive (THINK, kind and true posts, privacy settings)"]],
    ["Why is tone hard to read in a text? How should you respond?",
      "The reader can't hear your voice or see your face. Don't assume the worst; kindly ask if everything is okay.",
      ["I said you can't hear their voice or see their face", "I said to not assume the worst and kindly ask (or talk in person)"]],
    ["What is ONE honest and ONE dishonest way to use AI for homework?",
      "Honest: asking AI to explain a hard idea, then doing the work yourself. Dishonest: having AI write it and turning it in as your own.",
      ["I gave an honest way (AI explains, I do the work)", "I gave a dishonest way (AI does the work, I turn it in as mine)"]],
    ["How can you obey Ephesians 4:29 online?",
      "Only post and text words that are good and build others up. Don't gossip, insult, or share mean posts.",
      ["I said to use words that build others up", "I named something to avoid (gossip, insults, bad language, mean posts)"]]
  ];

  return { labels: { term: "Word", def: "Meaning" }, terms: TERMS, extraCards: EXTRA_CARDS, mc: MC, tf: TF, short: SHORT };
})();
