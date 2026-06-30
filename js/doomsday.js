/*
 * Doomsday Scenario — page-specific behavior
 * - Sticky section nav: scroll-spy + auto-open on click
 * - Playtest character creator: scenario / archetype / career / extra-trait
 *   selection, stat computation from trait deltas, and result-sheet render
 */

(function(){
  // ── scroll-spy + auto-open for sticky section nav ──
  var navLinks = document.querySelectorAll('[data-secnav]');
  var sections = ['brand','mechanics','settings','playtest'].map(function(id){ return document.getElementById(id); });

  function updateNav(){
    var pos = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function(s){ if (s && s.offsetTop <= pos) current = s; });
    navLinks.forEach(function(a){
      a.classList.toggle('is-current', current && a.getAttribute('href') === '#' + current.id);
    });
  }
  document.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  // Sections are native <details> elements so they can be collapsed independently.
  // If a user collapses one and then jumps to it via the sticky nav, re-open it
  // so the anchor scroll actually lands on visible content.
  navLinks.forEach(function(a){
    a.addEventListener('click', function(){
      var id = a.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (target && target.tagName === 'DETAILS') target.open = true;
    });
  });

  // ── playtest quiz ──
  // ── shared trait library ──
  // deltas: stat deltas applied on top of a baseline of 3 per stat (clamped 1-9)
  var TRAITS = {
    // Archetype traits — Jock
    star_athlete:       { name:"Star Athlete", type:"pos", skill:"Athletics", flavor:"Captain of three varsity teams, and never lets anyone forget it." },
    team_captain:       { name:"Team Captain", type:"pos", skill:"Leadership", flavor:"Used to rallying a locker room before a big game. Turns out that translates." },
    head_trauma:        { name:"One Too Many Concussions", type:"neg", deltas:{Intellect:-2}, flavor:"Took one too many hits to the head and never quite got all the way back up." },
    // Nerd
    photographic_memory:{ name:"Photographic Memory", type:"pos", deltas:{Intellect:2}, flavor:"Remembers every page of every book they've ever skimmed." },
    gadget_geek:        { name:"Gadget Geek", type:"pos", deltas:{Dexterity:1}, skill:"Mechanics", item:"Multitool", flavor:"Carries a backpack full of half-finished electronics projects — one of which might actually help." },
    social_anxiety:      { name:"Social Anxiety", type:"neg", deltas:{Charisma:-2,Nerve:-1}, flavor:"Would rather face the apocalypse than make eye contact with a stranger." },
    // Ladies' Man
    smooth_talker:       { name:"Smooth Talker", type:"pos", skill:"Persuasion", flavor:"Has talked their way out of more trouble than anyone should be proud of." },
    black_book:          { name:"Black Book", type:"pos", item:"Black Book of Contacts", flavor:"Knows someone in every town who owes them a favor — or used to date them." },
    commitment_issues:   { name:"Commitment Issues", type:"neg", deltas:{Nerve:-2}, skill:"Stealth", flavor:"Bails the second things start to feel real — but is very, very good at it." },
    // Meathead
    raw_power:           { name:"Raw Power", type:"pos", deltas:{Vigor:2}, flavor:"Bench presses things that should probably require a forklift." },
    doesnt_feel_pain:    { name:"Doesn't Feel Pain", type:"pos", deltas:{Vigor:1}, skill:"Brawling", flavor:"Numb to pain in a way that's either a gift or a serious medical problem." },
    fourth_grade_reading:{ name:"Reads at a 4th Grade Level", type:"neg", deltas:{Intellect:-2}, flavor:"Sounds out the big words. Still hasn't finished the warning label." },
    // Himbo/Bimbo
    disarmingly_charming:{ name:"Disarmingly Charming", type:"pos", skill:"Persuasion", flavor:"Too nice and too pretty for anyone to stay mad at." },
    surprisingly_strong: { name:"Surprisingly Strong", type:"pos", item:"Improvised Pipe Weapon", flavor:"Nobody expects the upper-body strength until it's much too late." },
    book_smart_no:       { name:"Book Smart? No.", type:"neg", deltas:{Intellect:-2}, flavor:"Genuinely, deeply unaware of how anything works. It's kind of endearing." },
    // Final Girl/Guy
    survivors_instinct:  { name:"Survivor's Instinct", type:"pos", skill:"Stealth", flavor:"Knows exactly when to go quiet and exactly where the exits are." },
    plan_b:              { name:"Always Has a Plan B", type:"pos", item:"Emergency Go-Bag", flavor:"Always has a backup plan, and the backup plan has a backpack." },
    trust_issues:        { name:"Trust Issues", type:"neg", deltas:{Charisma:-2}, flavor:"Has been the only survivor before. Doesn't love the group's odds." },
    // Conspiracy Theorist
    connected_dots:      { name:"Connected the Dots", type:"pos", skill:"Research", flavor:"Has a corkboard at home and red string for exactly this occasion." },
    doomsday_bunker:     { name:"Doomsday Bunker", type:"pos", item:"Gas Mask", flavor:"Built a bunker in the backyard. The neighbors thought it was weird. It was not weird." },
    nobody_believes_me:  { name:"Nobody Believes Me", type:"neg", deltas:{Charisma:-2}, skill:"Research", flavor:"Has been right before. Has also been completely insufferable about it." },
    // Doomsday Prepper
    stockpiled_supplies: { name:"Stockpiled Supplies", type:"pos", item:"Bug-Out Bag", flavor:"Has enough canned goods in the basement to outlast a small siege." },
    tactical_training:   { name:"Tactical Training", type:"pos", skill:"Firearms", flavor:"Spent every weekend at the range preparing for exactly this." },
    paranoid_loner:      { name:"Paranoid Loner", type:"neg", deltas:{Charisma:-2}, item:"Padlock", flavor:"Trusts the group about as far as they can throw the group. Locks every door behind them." },
    // Cryptid Hunter
    tracker:             { name:"Tracker", type:"pos", skill:"Tracking", flavor:"Can follow a trail through brush nobody else even noticed was disturbed." },
    monster_lore:        { name:"Monster Lore", type:"pos", skill:"Lore", flavor:"Has read every grainy forum post and blurry photo thread there is." },
    obsessive:           { name:"Obsessive", type:"neg", deltas:{Charisma:-2}, item:"Notebook of Theories", flavor:"Won't shut up about it, but the notebook is, annoyingly, kind of useful." },
    // Sea Dog
    old_salt:            { name:"Old Salt", type:"pos", deltas:{Dexterity:2}, flavor:"Has weathered worse storms than this in boats half this size." },
    iron_stomach:        { name:"Iron Stomach", type:"pos", item:"Flask of Rum", flavor:"Keeps something strong on hand for emergencies. Most things qualify as emergencies." },
    superstitious:       { name:"Superstitious", type:"neg", deltas:{Intellect:-2}, flavor:"Won't whistle on deck, won't say the Q-word, refuses to explain why." },
    // Influencer
    ring_light_ready:    { name:"Ring Light Ready", type:"pos", skill:"Persuasion", item:"Phone & Camera", flavor:"Filming this for the followers. The followers are not currently helpful." },
    surprisingly_resourceful:{ name:"Surprisingly Resourceful", type:"pos", item:"Portable Charger", flavor:"Has MacGyver'd a ring light out of a flashlight before. This isn't that different." },
    main_character_syndrome:{ name:"Main Character Syndrome", type:"neg", deltas:{Nerve:-2}, flavor:"Freezes the second there's no audience watching them be brave." },
    // Washed-Up Action Star
    old_stuntman_tricks: { name:"Old Stuntman Tricks", type:"pos", skill:"Brawling", flavor:"Did their own stunts. Once. In 1994. Still remembers how to fall." },
    quotable_one_liners: { name:"Quotable One-Liners", type:"pos", item:"Worn VHS Tape", flavor:"Has a one-liner ready for literally any situation, appropriate or not." },
    bad_knees:           { name:"Bad Knees", type:"neg", deltas:{Dexterity:-2}, item:"Cane", flavor:"The knees haven't been the same since the stunt double quit in '99." },

    // Career traits — Cop
    trained_marksman:   { name:"Trained Marksman", type:"pos", skill:"Firearms", item:"Sidearm", flavor:"Qualified at the range every year, whether they wanted to or not." },
    authority_figure:   { name:"Authority Figure", type:"pos", skill:"Intimidation", flavor:"Used to people listening when they raise their voice." },
    burnt_out:          { name:"Burnt Out", type:"neg", deltas:{Luck:-2}, flavor:"Has seen too much of this town's worst nights to feel lucky about anything." },
    // Teacher
    patient_educator:   { name:"Patient Educator", type:"pos", skill:"Leadership", flavor:"Has gotten thirty kids to sit still. This room is comparatively easy." },
    crowd_control:      { name:"Crowd Control", type:"pos", item:"Whistle", flavor:"Knows exactly how to keep a room from spiraling into chaos." },
    underpaid_exhausted:{ name:"Underpaid & Exhausted", type:"neg", deltas:{Vigor:-2}, flavor:"Has been running on grading-stack adrenaline and bad coffee for a decade." },
    // Soldier
    combat_trained:     { name:"Combat Trained", type:"pos", skill:"Firearms", item:"Rifle", flavor:"Did two tours. This isn't the first warzone, just a stranger one." },
    battle_tested:      { name:"Battle-Tested Nerves", type:"pos", item:"Combat Knife", flavor:"Doesn't flinch at things that should make a person flinch." },
    thousand_yard_stare:{ name:"Thousand-Yard Stare", type:"neg", deltas:{Charisma:-2}, item:"Spent Shell Casing", flavor:"Stopped making small talk somewhere around the second deployment." },
    // Nurse/Doctor
    trauma_medicine:    { name:"Trauma Medicine", type:"pos", skill:"First Aid", item:"Med Kit", flavor:"Has stitched up worse than this in a hospital hallway during a slow shift." },
    steady_hands:       { name:"Steady Hands", type:"pos", item:"Suture Kit", flavor:"Hands don't shake even when everything else in the room is falling apart." },
    compassion_fatigue: { name:"Compassion Fatigue", type:"neg", deltas:{Luck:-2}, flavor:"Has run out of bedside manner to spare for one more crisis." },
    // Mechanic
    jury_rig:           { name:"Jury-Rig Anything", type:"pos", skill:"Mechanics", item:"Toolkit", flavor:"Can keep something running well past the point it should have quit." },
    grease_monkey:      { name:"Grease Monkey Grit", type:"pos", item:"Spare Parts", flavor:"Knows an engine's problems by sound before popping the hood." },
    doesnt_play_well:   { name:"Doesn't Play Well With Others", type:"neg", deltas:{Charisma:-2}, flavor:"Prefers the company of a broken carburetor to most people." },
    // Scientist
    brilliant_mind:     { name:"Brilliant Mind", type:"pos", skill:"Research", flavor:"Has a working theory. Several, actually, and most of them are unsettling." },
    lab_discipline:      { name:"Lab Discipline", type:"pos", skill:"Research", flavor:"Follows procedure even when procedure clearly wasn't built for this." },
    socially_inept:      { name:"Socially Inept", type:"neg", deltas:{Charisma:-2}, flavor:"Explains things in a way that's accurate and somehow still confusing." },
    // Bartender
    reads_people:        { name:"Reads People", type:"pos", skill:"Persuasion", flavor:"Can read a room of strangers in about four seconds flat." },
    knows_a_guy:         { name:"Knows a Guy", type:"pos", item:"Whiskey Flask", flavor:"Has a guy for everything. The guy usually delivers." },
    functioning_alcoholic:{ name:"Functioning Alcoholic", type:"neg", deltas:{Vigor:-2}, flavor:"Has a drink in hand more often than is probably advisable right now." },
    // Journalist
    right_questions:     { name:"Asks the Right Questions", type:"pos", skill:"Research", flavor:"Knows exactly which question makes a source's face fall." },
    talks_way_in:        { name:"Talks Their Way In", type:"pos", item:"Press Badge", flavor:"Has talked their way past more roadblocks and guards than seems legal." },
    reckless_pursuit:    { name:"Reckless Pursuit of the Truth", type:"neg", deltas:{Nerve:-2}, flavor:"Chases the story straight past the point where it's still a good idea." },
    // Construction Worker
    built_different:     { name:"Built Different", type:"pos", deltas:{Vigor:1}, item:"Crowbar", flavor:"Has been lifting things heavier than most people since before this started." },
    building_codes:      { name:"Knows the Building Codes", type:"pos", item:"Blueprint Set", flavor:"Knows which walls are load-bearing and which doors were never up to code." },
    bad_back:            { name:"Bad Back", type:"neg", deltas:{Dexterity:-2}, item:"Back Brace", flavor:"Twenty years on job sites left a permanent ache nobody warned them about." },
    // Park Ranger
    wilderness_survival: { name:"Wilderness Survival", type:"pos", skill:"Survival", flavor:"Has spent more nights outdoors than in an actual bed." },
    trackers_eye:        { name:"Tracker's Eye", type:"pos", item:"Binoculars", flavor:"Notices broken branches and disturbed dirt that everyone else walks right past." },
    gun_nut:             { name:"Gun Nut", type:"neg", deltas:{Charisma:-2}, skill:"Firearms", item:"Hunting Rifle", flavor:"Has opinions about ammunition nobody asked for, and a rifle to back them up." },

    // Extra Traits (player picks exactly 2, not tied to Archetype or Career)
    alcoholic:    { name:"Alcoholic", type:"extra", deltas:{Charisma:2,Dexterity:-2}, flavor:"Steadier nerves after a drink, shakier hands after three." },
    promiscuous:  { name:"Promiscuous", type:"extra", deltas:{Charisma:2,Intellect:-2}, flavor:"Charming enough to get into trouble, not quite sharp enough to see it coming." },
    klutz:        { name:"Klutz", type:"extra", deltas:{Dexterity:-2,Luck:1}, flavor:"Trips over flat ground but somehow always lands somewhere good." },
    daredevil:    { name:"Daredevil", type:"extra", skill:"Climbing", flavor:"Has no sense of self-preservation, but climbs like it's absolutely nothing." },
    silver_tongue:{ name:"Silver Tongue", type:"extra", skill:"Negotiation", flavor:"Has talked their way out of speeding tickets and worse. Karma's due any day now." },
    bookworm:     { name:"Bookworm", type:"extra", skill:"Research", flavor:"Has read every survival manual ever published. Untested in the actual field." },
    trust_fund_kid:{ name:"Trust Fund Kid", type:"extra", item:"Wad of Cash", flavor:"Never worked a day in their life. The cash still spends, though." },
    pack_rat:     { name:"Pack Rat", type:"extra", item:"Bag of Random Useful Junk", flavor:"Never throws anything away. Today, finally, that pays off." },
    keepsake:     { name:"Sentimental Keepsake", type:"extra", item:"Pocket Knife", flavor:"Carries a late relative's pocket knife everywhere. Hasn't needed it. Yet." },
    hypochondriac:{ name:"Hypochondriac", type:"extra", deltas:{Nerve:-2}, skill:"First Aid", flavor:"Has researched every way this could go wrong, and picked up real medical know-how doing it." },
    night_owl:    { name:"Night Owl", type:"extra", deltas:{Nerve:1}, skill:"Stealth", flavor:"Sharpest at 3am, and good at moving quietly while everyone else sleeps." },
    insomniac:    { name:"Insomniac", type:"extra", deltas:{Vigor:-1}, item:"Thermos of Coffee", flavor:"Hasn't slept properly in weeks. Running entirely on caffeine and spite." }
  };

  var SCENARIOS = [
    { id:"invasion", name:"Invasion", tag:"They're not from around here.", blurb:"Lights in the sky, government denials, and a backyard that isn't safe anymore.", quote:"\u201cThe lights weren't weather balloons.\u201d" },
    { id:"marooned", name:"Marooned", tag:"No signal. No rescue. Just the island.", blurb:"The boat's gone, the radio's dead, and something's moving in the treeline.", quote:"\u201cNo signal. No rescue. Just us, and whatever's out there.\u201d" },
    { id:"deadwalk", name:"Deadwalk", tag:"They used to be the neighbors.", blurb:"The dead won't stay down, and the living are running out of places to hide.", quote:"\u201cNone of us are trained for this. That's the game.\u201d" },
    { id:"stomping", name:"Stomping Ground", tag:"Something the size of a building just woke up.", blurb:"A city-leveling monster, a skyline on fire, and a population running the wrong way.", quote:"\u201cRun. Don't look up. Run.\u201d" },
    { id:"midnight", name:"Midnight", tag:"The clock just ran out.", blurb:"Sirens, a fifteen-minute warning, and a bunker door that may not open in time.", quote:"\u201cThe countdown is on the news. It's accurate.\u201d" }
  ];

  var ARCHETYPES = [
    { id:"jock", name:"The Jock", blurb:"First through the door, last to think it through.", fits:["stomping","deadwalk"], traits:["star_athlete","team_captain","head_trauma"] },
    { id:"nerd", name:"The Nerd", blurb:"Knows the science nobody else paid attention to.", fits:["invasion","midnight"], traits:["photographic_memory","gadget_geek","social_anxiety"] },
    { id:"ladies_man", name:"The Ladies' Man", blurb:"Charms everyone, commits to no one.", fits:["marooned","deadwalk"], traits:["smooth_talker","black_book","commitment_issues"] },
    { id:"meathead", name:"The Meathead", blurb:"Strong opinions about protein, no opinions about anything else.", fits:["deadwalk","stomping"], traits:["raw_power","doesnt_feel_pain","fourth_grade_reading"] },
    { id:"himbo", name:"The Bimbo/Himbo", blurb:"Disarmingly kind, alarmingly under-informed.", fits:["marooned","invasion"], traits:["disarmingly_charming","surprisingly_strong","book_smart_no"] },
    { id:"final_girl", name:"The Final Girl/Guy", blurb:"Has seen this movie before. Knows how it goes.", fits:["deadwalk","stomping"], traits:["survivors_instinct","plan_b","trust_issues"] },
    { id:"conspiracy", name:"The Conspiracy Theorist", blurb:"Called it. Nobody listened. Called it anyway.", fits:["invasion","stomping"], traits:["connected_dots","doomsday_bunker","nobody_believes_me"] },
    { id:"prepper", name:"The Doomsday Prepper", blurb:"Has a bug-out bag for every room in the house.", fits:["midnight","deadwalk"], traits:["stockpiled_supplies","tactical_training","paranoid_loner"] },
    { id:"cryptid", name:"The Cryptid Hunter", blurb:"Has a folder. The folder is thick.", fits:["stomping","invasion"], traits:["tracker","monster_lore","obsessive"] },
    { id:"sea_dog", name:"The Sea Dog", blurb:"Talks like the ocean owes them money.", fits:["marooned"], traits:["old_salt","iron_stomach","superstitious"] },
    { id:"influencer", name:"The Influencer", blurb:"Filming this for content. Always filming.", fits:["invasion","stomping"], traits:["ring_light_ready","surprisingly_resourceful","main_character_syndrome"] },
    { id:"action_star", name:"The Washed-Up Action Star", blurb:"Did their own stunts. Once. In 1994.", fits:["stomping","midnight"], traits:["old_stuntman_tricks","quotable_one_liners","bad_knees"] }
  ];

  var CAREERS = [
    { id:"cop", name:"Cop", blurb:"Has seen worse. Hasn't seen this.", traits:["trained_marksman","authority_figure","burnt_out"] },
    { id:"teacher", name:"Teacher", blurb:"Can get thirty kids to sit down. Can probably get this room to.", traits:["patient_educator","crowd_control","underpaid_exhausted"] },
    { id:"soldier", name:"Soldier", blurb:"Trained for combat. Not for this particular combat.", traits:["combat_trained","battle_tested","thousand_yard_stare"] },
    { id:"nurse", name:"Nurse/Doctor", blurb:"Triage under pressure, every single shift.", traits:["trauma_medicine","steady_hands","compassion_fatigue"] },
    { id:"mechanic", name:"Mechanic", blurb:"Can fix or hot-wire almost anything with an engine.", traits:["jury_rig","grease_monkey","doesnt_play_well"] },
    { id:"scientist", name:"Scientist", blurb:"Has a working theory. Several, actually.", traits:["brilliant_mind","lab_discipline","socially_inept"] },
    { id:"bartender", name:"Bartender", blurb:"Has heard every secret this town has.", traits:["reads_people","knows_a_guy","functioning_alcoholic"] },
    { id:"journalist", name:"Journalist", blurb:"Following the story straight into the danger.", traits:["right_questions","talks_way_in","reckless_pursuit"] },
    { id:"construction", name:"Construction Worker", blurb:"Knows which walls are load-bearing. Useful, lately.", traits:["built_different","building_codes","bad_back"] },
    { id:"ranger", name:"Park Ranger", blurb:"Knows the woods. Knows the guns. Knows the silence between them.", traits:["wilderness_survival","trackers_eye","gun_nut"] }
  ];

  var EXTRA_TRAIT_IDS = ["alcoholic","promiscuous","klutz","daredevil","silver_tongue","bookworm","trust_fund_kid","pack_rat","keepsake","hypochondriac","night_owl","insomniac"];

  var FIRST = ["Sam","Alex","Jordan","Casey","Riley","Morgan","Drew","Taylor","Quinn","Devon"];
  var LAST  = ["Reyes","Park","Novak","Whitfield","Okafor","Bianchi","Castillo","Munro","Esposito","Hale"];

  // ── render option lists ──
  function el(html){ var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function effectsText(t){
    var parts = [];
    if (t.deltas) {
      var ds = Object.keys(t.deltas).map(function(k){ var v = t.deltas[k]; return (v > 0 ? '+' : '') + v + ' ' + k; });
      if (ds.length) parts.push(ds.join(', '));
    }
    if (t.skill) parts.push('Skill: ' + t.skill);
    if (t.item) parts.push('Item: ' + t.item);
    return parts.length ? parts.join(' · ') : 'No mechanical effect — pure flavor';
  }


  var quiz = document.getElementById('ddQuiz');
  var result = document.getElementById('ddResult');
  var btnNext = document.getElementById('ddNext');
  var btnBack = document.getElementById('ddBack');
  var extraCountEl = document.getElementById('ddExtraCount');

  var scenarioWrap = quiz.querySelector('[data-group="scenario"]');
  SCENARIOS.forEach(function(s){
    scenarioWrap.appendChild(el(
      '<button class="dd-quiz-opt dd-scenario-opt" data-value="' + s.id + '">' +
        '<span class="dd-quiz-opt-tag">' + s.tag + '</span>' +
        '<span class="dd-quiz-opt-name">' + s.name + '</span>' +
        '<span class="dd-quiz-opt-desc">' + s.blurb + '</span>' +
      '</button>'
    ));
  });

  var archWrap = quiz.querySelector('[data-group="archetype"]');
  ARCHETYPES.forEach(function(a){
    archWrap.appendChild(el(
      '<button class="dd-quiz-opt" data-value="' + a.id + '">' +
        '<span class="dd-quiz-opt-name">' + a.name + '</span>' +
        '<span class="dd-quiz-opt-desc">' + a.blurb + '</span>' +
        '<span class="dd-quiz-opt-fit">Thrives in: ' + a.fits.map(function(f){ return SCENARIOS.find(function(s){return s.id===f;}).name; }).join(', ') + '</span>' +
      '</button>'
    ));
  });

  var careerWrap = quiz.querySelector('[data-group="career"]');
  CAREERS.forEach(function(c){
    careerWrap.appendChild(el(
      '<button class="dd-quiz-opt" data-value="' + c.id + '">' +
        '<span class="dd-quiz-opt-name">' + c.name + '</span>' +
        '<span class="dd-quiz-opt-desc">' + c.blurb + '</span>' +
      '</button>'
    ));
  });

  var extrasWrap = quiz.querySelector('[data-group="extras"]');
  EXTRA_TRAIT_IDS.forEach(function(tid){
    var t = TRAITS[tid];
    extrasWrap.appendChild(el(
      '<button class="dd-quiz-opt" data-value="' + tid + '">' +
        '<span class="dd-quiz-opt-name">' + t.name + '</span>' +
        '<span class="dd-quiz-opt-desc">' + t.flavor + '</span>' +
        '<span class="dd-quiz-opt-fx">' + effectsText(t) + '</span>' +
      '</button>'
    ));
  });

  // ── quiz state & navigation ──
  var state = { scenario: null, archetype: null, career: null, extras: [] };
  var step = 1;

  function groupForStep(n){ return n===1?'scenario':n===2?'archetype':n===3?'career':'extras'; }

  function showStep(n){
    quiz.querySelectorAll('.dd-quiz-step').forEach(function(stepEl){
      stepEl.classList.toggle('is-active', parseInt(stepEl.getAttribute('data-step'),10) === n);
    });
    btnBack.disabled = (n === 1);
    if (n === 4) {
      btnNext.disabled = state.extras.length !== 2;
      btnNext.textContent = 'Generate Survivor →';
    } else {
      var key = groupForStep(n);
      btnNext.disabled = !state[key];
      btnNext.textContent = 'Next →';
    }
  }

  quiz.querySelectorAll('.dd-quiz-options').forEach(function(group){
    var key = group.getAttribute('data-group');
    var isMulti = group.getAttribute('data-multi') === '2';
    group.querySelectorAll('.dd-quiz-opt').forEach(function(btn){
      btn.addEventListener('click', function(){
        if (!isMulti) {
          group.querySelectorAll('.dd-quiz-opt').forEach(function(s){ s.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          state[key] = btn.getAttribute('data-value');
        } else {
          var val = btn.getAttribute('data-value');
          var idx = state.extras.indexOf(val);
          if (idx > -1) {
            state.extras.splice(idx, 1);
            btn.classList.remove('is-selected');
          } else if (state.extras.length < 2) {
            state.extras.push(val);
            btn.classList.add('is-selected');
          }
          extraCountEl.textContent = '(' + state.extras.length + '/2 selected)';
          group.querySelectorAll('.dd-quiz-opt').forEach(function(s){
            var selected = state.extras.indexOf(s.getAttribute('data-value')) > -1;
            s.classList.toggle('is-disabled', !selected && state.extras.length >= 2);
          });
        }
        showStep(step);
      });
    });
  });

  btnNext.addEventListener('click', function(){
    if (step < 4) { step++; showStep(step); }
    else { generateCharacter(); quiz.style.display = 'none'; result.classList.add('is-active'); }
  });
  btnBack.addEventListener('click', function(){
    if (step > 1) { step--; showStep(step); }
  });

  // ── character generation ──
  var STAT_KEYS = ['Vigor','Nerve','Charisma','Intellect','Dexterity','Luck'];

  function buildCharacter(){
    var scenario = SCENARIOS.find(function(s){ return s.id === state.scenario; });
    var archetype = ARCHETYPES.find(function(a){ return a.id === state.archetype; });
    var career = CAREERS.find(function(c){ return c.id === state.career; });
    var traitIds = archetype.traits.concat(career.traits).concat(state.extras);
    var traits = traitIds.map(function(id){ return Object.assign({ id:id }, TRAITS[id]); });

    var stats = {}; STAT_KEYS.forEach(function(k){ stats[k] = 3; });
    var skills = []; var items = [];
    traits.forEach(function(t){
      Object.keys(t.deltas || {}).forEach(function(k){ stats[k] += t.deltas[k]; });
      if (t.skill && skills.indexOf(t.skill) === -1) skills.push(t.skill);
      if (t.item && items.indexOf(t.item) === -1) items.push(t.item);
    });
    STAT_KEYS.forEach(function(k){ stats[k] = Math.max(1, Math.min(9, stats[k])); });

    return { scenario: scenario, archetype: archetype, career: career, traits: traits, stats: stats, skills: skills, items: items };
  }

  var currentChar = null;

  function renderCharacter(c){
    document.getElementById('ddResultSetting').textContent = c.scenario.name + ' — ' + c.scenario.tag;
    document.getElementById('ddResultArch').textContent = c.archetype.name;
    document.getElementById('ddResultCareer').textContent = c.career.name;
    document.getElementById('ddResultQuote').textContent = c.scenario.quote;

    var statsWrap = document.getElementById('ddResultStats');
    statsWrap.innerHTML = '';
    STAT_KEYS.forEach(function(k){
      statsWrap.appendChild(el('<div class="dd-result-stat"><div class="dd-result-stat-label">' + k + '</div><div class="dd-result-stat-val">' + c.stats[k] + '</div></div>'));
    });

    var traitsWrap = document.getElementById('ddResultTraits');
    traitsWrap.innerHTML = '';
    var traitSources = c.archetype.traits.map(function(){ return c.archetype.name; })
      .concat(c.career.traits.map(function(){ return c.career.name; }))
      .concat(state.extras.map(function(){ return 'Extra'; }));
    c.traits.forEach(function(t, i){
      var badgeClass = t.type === 'neg' ? 'dd-trait-badge--neg' : 'dd-trait-badge--pos';
      var badgeLabel = t.type === 'neg' ? 'Drawback' : (t.type === 'extra' ? 'Extra' : 'Trait');
      traitsWrap.appendChild(el(
        '<div class="dd-trait-row">' +
          '<span class="dd-trait-badge ' + badgeClass + '">' + badgeLabel + '</span>' +
          '<span class="dd-trait-name">' + t.name + '</span>' +
          '<span class="dd-trait-src">— ' + traitSources[i] + '</span>' +
          '<span class="dd-trait-flavor">' + t.flavor + '</span>' +
          '<span class="dd-trait-fx">' + effectsText(t) + '</span>' +
        '</div>'
      ));
    });

    var skillsWrap = document.getElementById('ddResultSkills');
    skillsWrap.innerHTML = c.skills.length
      ? c.skills.map(function(s){ return '<span class="dd-chip">' + s + '</span>'; }).join('')
      : '<span class="dd-chip dd-chip--empty">No trained skills — good luck</span>';

    var itemsWrap = document.getElementById('ddResultItems');
    itemsWrap.innerHTML = c.items.length
      ? c.items.map(function(s){ return '<span class="dd-chip">' + s + '</span>'; }).join('')
      : '<span class="dd-chip dd-chip--empty">Empty pockets</span>';
  }

  function generateCharacter(){
    currentChar = buildCharacter();
    var name = FIRST[Math.floor(Math.random()*FIRST.length)] + ' ' + LAST[Math.floor(Math.random()*LAST.length)];
    document.getElementById('ddResultName').textContent = name;
    renderCharacter(currentChar);
  }

  document.getElementById('ddReroll').addEventListener('click', function(){
    var name = FIRST[Math.floor(Math.random()*FIRST.length)] + ' ' + LAST[Math.floor(Math.random()*LAST.length)];
    document.getElementById('ddResultName').textContent = name;
  });
  document.getElementById('ddRestart').addEventListener('click', function(){
    state = { scenario: null, archetype: null, career: null, extras: [] };
    step = 1;
    quiz.querySelectorAll('.dd-quiz-opt').forEach(function(s){ s.classList.remove('is-selected','is-disabled'); });
    extraCountEl.textContent = '(0/2 selected)';
    showStep(1);
    result.classList.remove('is-active');
    quiz.style.display = '';
  });

  showStep(1);
})();
