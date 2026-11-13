/* Computer Basics study guide data (used by js/review-engine.js). Written in new words so the exam is never posted. */
window.REVIEW = (function () {
  var TERMS = [
    ["Keyboard", "The part you use to type letters and numbers."],
    ["Mouse", "Used to point and click on things on the screen."],
    ["Monitor", "The screen that shows you what the computer is doing."],
    ["Speakers", "Let you hear sound from the computer."],
    ["USB flash drive", "A small device that stores files so you can carry them to another computer."],
    ["Internet", "The giant network that connects computers around the world. You need it to visit websites."],
    ["Wi-Fi", "Connects a computer to the internet without a cable."],
    ["Web browser", "A program you use to visit websites, like Google Chrome."],
    ["www", "Stands for World Wide Web, the websites on the internet."],
    ["Google", "A website you use to search for information."],
    ["Google Docs", "A program for typing essays, reports, and other documents."],
    ["Desktop", "The main screen you see after the computer starts, with icons and a background picture."],
    ["Recycle Bin / Trash", "Where a deleted file usually goes first, so you can still get it back."],
    ["Cursor", "The blinking line (or arrow) that shows where you are on the screen."],
    ["Shut Down", "The correct way to turn off a computer, chosen from the menu."],
    ["Pop-up ad", "A window that suddenly appears trying to get you to click. Close it; don't click inside it."]
  ];

  var MC = [
    ["Which part of the computer do you LOOK at to see your work?", ["Monitor", "Keyboard", "Mouse", "Speakers"], "The monitor is the screen."],
    ["You need to type your name on an assignment. Which part do you use?", ["Keyboard", "Mouse", "Monitor", "Speakers"], "The keyboard is for typing letters and numbers."],
    ["Which part helps you point at a button and click it?", ["Mouse", "Monitor", "Speakers", "USB flash drive"], "The mouse (or trackpad) points and clicks."],
    ["You can't hear the video your class is watching. Which part makes the sound?", ["Speakers", "Monitor", "Keyboard", "Mouse pad"], "Speakers (or headphones) play sound."],
    ["Your class wants to look at a website. What must the computer be connected to?", ["The internet", "A printer", "A calculator", "Speakers"], "Websites live on the internet."],
    ["Which lets a laptop get on the internet without plugging in a cable?", ["Wi-Fi", "A USB flash drive", "A monitor", "A mouse pad"], "Wi-Fi is a wireless internet connection."],
    ["Google Chrome is an example of a…", ["Web browser", "Printer", "Keyboard", "Speaker"], "A web browser is the program you use to visit websites."],
    ["In a website address, what does \"www\" stand for?", ["World Wide Web", "Wide World Website", "Web World Wide", "World Web Window"], "www = World Wide Web."],
    ["You want to take your project from school to your computer at home. What could you save it on?", ["A USB flash drive", "The monitor", "The speakers", "The mouse pad"], "A USB flash drive stores files you can carry."],
    ["Which program is best for typing a book report?", ["Google Docs", "Calculator", "Paint", "Google Maps"], "Google Docs is for typing documents."],
    ["Which website do people use to search for information?", ["Google", "Paint", "A USB drive", "The Recycle Bin"], "Google is a search website."],
    ["Which password is the STRONGEST?", ["Moon!River7#Hawk", "abc123", "qwerty", "Your dog's name"], "Strong passwords are long and mix letters, numbers, and symbols."],
    ["You deleted a file by mistake. Where should you look for it first?", ["The Recycle Bin or Trash", "The printer", "The internet", "The monitor"], "Deleted files usually go to the Recycle Bin or Trash first."],
    ["What do we call the main screen with icons and a background picture after the computer starts?", ["The desktop", "The browser", "The cursor", "The keyboard"], "That's the desktop."],
    ["What is the RIGHT way to turn off a computer?", ["Choose Shut Down from the menu", "Unplug it from the wall", "Turn off only the monitor", "Pull out the battery"], "Shut Down lets the computer close everything safely."],
    ["What should you do BEFORE you shut down the computer?", ["Save your work", "Turn up the volume", "Open more tabs", "Unplug the mouse"], "Saving first keeps your work from getting lost."],
    ["You see something online that makes you uncomfortable. What should you do?", ["Tell a teacher or parent", "Share it with friends", "Click on it again", "Keep it a secret"], "A trusted adult can help."],
    ["A window pops up saying \"You WON a free tablet! Click here!\" What should you do?", ["Close it without clicking inside it", "Click it to get the prize", "Type your address into it", "Send it to a friend"], "Pop-up ads can be tricks. Don't click them."],
    ["What is the blinking line that shows where your typing will appear?", ["The cursor", "The desktop", "The browser", "The monitor"], "That's the cursor."],
    ["Why should you keep drinks away from the keyboard?", ["A spill can damage it", "Drinks make the computer slower", "Keyboards get thirsty", "It turns off the Wi-Fi"], "Liquid can ruin a keyboard or laptop."]
  ];

  var TF = [
    ["Saving your work often protects it from getting lost.", true, "Save early and often!"],
    ["It's fine for your best friend to know your password.", false, "Keep passwords private, even from friends."],
    ["The keyboard is the screen that shows pictures.", false, "That's the monitor. The keyboard is for typing."],
    ["A mouse lets you point and click on the screen.", true, "That's its job."],
    ["A spilled drink can damage a keyboard.", true, "Keep drinks away from computers."],
    ["A laptop with a dead battery and no charger will still turn on.", false, "Computers need power from a battery or a plug."],
    ["Wi-Fi connects you to the internet without a cable.", true, "Wi-Fi is wireless."],
    ["Turning off the computer without saving could make you lose your work.", true, "Always save first."],
    ["Every pop-up ad is safe to click.", false, "Pop-ups can be tricks. Close them."],
    ["You can use Google to search for information.", true, "Google is a search website."],
    ["Links sent to you by strangers are safe to open.", false, "Don't open links from people you don't know."],
    ["When you delete a file, it usually goes to the Recycle Bin or Trash first.", true, "You can often get it back from there."]
  ];

  return { labels: { term: "Word", def: "Meaning" }, terms: TERMS, mc: MC, tf: TF };
})();
