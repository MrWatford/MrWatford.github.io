/* =========================================================
   Holiday theme settings for EVERYONE who visits the site.
   The easy way to change this file: open holidays.html on the
   website, pick your settings, and click "Download settings
   file for everyone". Then upload that file here (js folder).

   auto       true  = holidays switch on and off by themselves
   seasonal   true  = spring/summer/fall/winter touches when no holiday is on
   animations true  = snow, leaves, fireworks, etc. move
   disabled   list of holidays to skip, like ["halloween"]
   adjust     move a holiday's start/end, like
              { christmas: { before: 3, after: 0 } }
              (before 3 = start 3 days earlier; after 2 = end 2 days later;
               negative numbers shorten it)
   force      ""          = normal (automatic)
              "none"      = standard look, no decorations
              "christmas" = show that theme every day until changed
   ========================================================= */
window.HOLIDAY_SETTINGS = {
  auto: true,
  seasonal: true,
  animations: true,
  disabled: [],
  adjust: {},
  force: ""
};
