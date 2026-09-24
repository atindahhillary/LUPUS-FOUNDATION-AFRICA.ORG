/* ==========================================================================
   Ask LFA - lupus information assistant
   --------------------------------------------------------------------------
   Answers come from a curated knowledge base written and reviewed by LFA,
   not from a language model. For a patient organisation that is deliberate:
   answers about a medical condition should be vetted, not improvised, and
   nothing a visitor types about their health ever leaves their device.

   To add a live model-backed backend later, set CHAT_ENDPOINT to a URL that
   accepts {message, history} and returns {reply}. The knowledge base then
   becomes the instant-answer layer and anything it cannot match is
   forwarded. Never put an API key in this file: it is public.
   ========================================================================== */
(function () {
  'use strict';

  var CHAT_ENDPOINT = ''; // e.g. 'https://your-worker.example.workers.dev/ask'
  var PHONE = '+254142851978';
  var PHONE_DISPLAY = '+254 142 851 978';
  var WHATSAPP = 'https://wa.me/254142851978';

  /* --------------------------------------------------------- Knowledge base */
  var KB = [
    { id: 'what', k: 'what is lupus define definition explain meaning sle systemic erythematosus autoimmune disease condition',
      a: '<p><strong>Lupus is a chronic autoimmune disease.</strong> The immune system, which normally protects you from infection, starts making antibodies that attack your own healthy tissue.</p><p>It can affect almost any part of the body, including the kidneys, brain, heart, lungs, blood, skin and joints. More than 90% of people with lupus are women, and it most often begins between the ages of 15 and 45.</p>',
      f: ['symptoms', 'causes', 'contagious'], cta: { l: 'Read the full guide', h: 'understanding-lupus.html' } },

    { id: 'symptoms', k: 'symptoms signs feel feeling experiencing rash butterfly joint pain swelling ulcers mouth sores tired fever headache',
      a: '<p>Lupus looks different in everyone, but the symptoms people most often describe are:</p><ul><li>Joint and muscle pain or swelling</li><li>Extreme fatigue and weakness</li><li>A butterfly-shaped rash across the cheeks and nose</li><li>Sensitivity to sunlight</li><li>Mouth or nose ulcers</li><li>Hair loss, low fevers, swollen glands</li><li>Chest pain when breathing deeply</li></ul><p>Symptoms come and go, which is one reason lupus takes so long to diagnose.</p>',
      f: ['tool', 'diagnosis', 'flares'], cta: { l: 'Open the symptom tool', h: 'understanding-lupus.html#symptoms' } },

    { id: 'tool', k: 'symptom tool checker check test quiz assessment do i have lupus think i might',
      a: '<p>We have a <strong>symptom reflection tool</strong> you can use. It is not a test and it cannot tell you whether you have lupus. What it does is help you organise what you have been feeling so you can describe it clearly to a doctor.</p><p>Many people find that taking a written list to an appointment changes the conversation completely.</p>',
      f: ['diagnosis', 'contact'], cta: { l: 'Open the tool', h: 'understanding-lupus.html#symptoms' } },

    { id: 'causes', k: 'causes cause why do people get caused trigger triggers genetic hereditary inherited runs in family hormones environment',
      a: '<p>There is <strong>no single known cause</strong>. Lupus has a genetic predisposition, and it may develop in response to hormones such as oestrogen or to environmental triggers like infection, UV light and certain medicines.</p><p>Identical twins of someone with lupus have around a 25% chance of developing it. Roughly 10 to 12% of people with lupus have a close relative with it.</p><p><strong>Nothing you did caused your lupus.</strong></p>',
      f: ['contagious', 'myths', 'women'] },

    { id: 'contagious', k: 'contagious catch infectious spread transmit give someone else is it dangerous to others witchcraft curse',
      a: '<p><strong>No. Lupus is neither infectious nor contagious.</strong></p><p>You cannot catch it from anyone through any kind of contact, and someone with lupus cannot pass it to you. It is also not caused by witchcraft or a curse. Beliefs like that delay diagnosis and push people away from treatment that works.</p>',
      f: ['myths', 'causes'] },

    { id: 'diagnosis', k: 'diagnosis diagnosed diagnose test tests blood work how do they know doctor rheumatologist referral ana',
      a: '<p>There is <strong>no single test</strong> that confirms or rules out lupus, which is why it often takes years. Diagnosis combines:</p><ul><li>Your medical history and the pattern of symptoms over time</li><li>A physical examination</li><li>Blood tests and urine tests</li><li>Referral to a rheumatologist</li></ul><p>A simple diary of what you feel and when makes this much faster.</p>',
      f: ['early', 'tool', 'treatment'], cta: { l: 'The diagnosis journey', h: 'understanding-lupus.html#diagnosis' } },

    { id: 'early', k: 'early diagnosis why does it matter important organ damage prevent delay late',
      a: '<p>Lupus can damage vital organs <strong>without obvious warning</strong>. Early diagnosis means earlier treatment and monitoring, which helps prevent permanent organ damage and improves quality of life.</p><p>In Africa, where many people face long delays, early detection can be the difference between living well with lupus and living with preventable complications.</p>',
      f: ['diagnosis', 'treatment'] },

    { id: 'treatment', k: 'treatment treat cure medicine medication drugs steroids prednisone hydroxychloroquine plaquenil immunosuppressant manage',
      a: '<p>There is <strong>no cure yet</strong>, but lupus can be controlled. Treatment is decided with your clinician and usually combines:</p><ul><li>Antimalarials such as hydroxychloroquine, which help fatigue, joint pain and rashes</li><li>Corticosteroids at the lowest effective dose</li><li>Immunosuppressive medicines or biologics for more severe disease</li><li>Regular monitoring of blood and kidney function</li><li>Sun protection, gentle exercise and rest</li></ul>',
      f: ['stopping', 'cost', 'diet'], cta: { l: 'Treatment and management', h: 'understanding-lupus.html#treatment' } },

    { id: 'stopping', k: 'stop stopping quit medication feel better should i continue skip doses side effects',
      a: '<p><strong>Please do not stop or change a lupus medicine without talking to your clinician.</strong></p><p>Feeling well usually means the treatment is working. Stopping because you feel better is one of the most common causes of a serious flare.</p><p>If side effects or cost are the problem, say so directly to your doctor. There are often alternatives.</p>',
      f: ['cost', 'treatment'] },

    { id: 'cure', k: 'cure cured permanent forever lifelong will it go away remission',
      a: '<p>There is no cure for lupus, and it is a lifelong condition. But it can go into <strong>remission</strong>, and with the right treatment and support many people live full lives, work, study and raise families.</p><p>As one of our warriors puts it: lupus does not mean life stops.</p>',
      f: ['treatment', 'stories'] },

    { id: 'flares', k: 'flare flares flare up worse getting bad episode relapse',
      a: '<p>A flare is a period when disease activity increases and symptoms get worse. Common triggers include sunlight, infection, stress and stopping medication.</p><p>Learning your own early warning signs and acting on them, rather than pushing through, is one of the most useful skills you can build.</p>',
      f: ['sun', 'living', 'stopping'] },

    { id: 'fatigue', k: 'fatigue tired exhausted no energy sleep weakness brain fog',
      a: '<p>Fatigue is one of the most disabling lupus symptoms, and one of the most invisible. It is not ordinary tiredness and it is not laziness.</p><p>What helps: pacing your energy across the week instead of spending it all on a good day, treating the underlying disease activity, and being honest with the people around you about what you can do.</p>',
      f: ['work', 'living', 'mental'] },

    { id: 'sun', k: 'sun sunlight uv photosensitive light outside burn protection',
      a: '<p>Sensitivity to sunlight and UV light is common, and sun exposure is a frequent trigger for rashes and flares.</p><p>Practical steps: cover up, use shade during the hottest part of the day, and talk to your clinician about sunscreen suitable for your skin.</p>',
      f: ['flares', 'living'] },

    { id: 'diet', k: 'diet food eat nutrition eating healthy weight salt alcohol fish supplements',
      a: '<p>Recommended diets feature oily fish, vegetables, semi-skimmed milk and white meat, while keeping cholesterol low. A calorie-controlled diet with reduced alcohol and salt is also advised.</p><p>Research suggests diets low in saturated fat and supplemented with fish oil can help. Discuss any change with your clinician, especially if your kidneys are affected.</p>',
      f: ['living', 'treatment'] },

    { id: 'living', k: 'living live well manage daily life cope coping routine exercise lifestyle',
      a: '<p>Managing lupus involves more than medication. What consistently helps:</p><ul><li>Protect yourself from the sun</li><li>Learn your early warning signs</li><li>Keep taking treatment even when you feel well</li><li>Pace your energy rather than spending it all at once</li><li>Move gently and regularly where you can</li><li>Tell someone how you actually are</li></ul>',
      f: ['fatigue', 'mental', 'support'], cta: { l: 'Living with lupus', h: 'living-with-lupus.html' } },

    { id: 'mental', k: 'mental health depression anxiety sad low mood counselling therapy psychosocial emotional lonely alone',
      a: '<p>Depression is a recognised part of the lupus picture, not a side issue. Living with an unpredictable illness carries real emotional weight, and that deserves the same attention as any other symptom.</p><p>What helps: talking to a counsellor, peer support where you do not have to explain yourself first, and telling your clinician about your mood and not only your joints.</p>',
      f: ['support', 'contact'], cta: { l: 'Lupus and mental health', h: 'living-with-lupus.html#mental-health' } },

    { id: 'work', k: 'work job employment career employer boss disclose telling workplace school study sick leave',
      a: '<p>Many people with lupus work and study. Fatigue and unpredictable flares are real, and some people need adjustments like flexible hours, rest breaks or a change of role.</p><p>You decide what to disclose, to whom, and when. Asking for a <em>specific</em> adjustment usually works better than a general explanation.</p>',
      f: ['fatigue', 'living'], cta: { l: 'Lupus and work', h: 'living-with-lupus.html#work' } },

    { id: 'pregnancy', k: 'pregnancy pregnant baby fertility conceive trying motherhood breastfeeding children having kids',
      a: '<p>Lupus does not significantly affect fertility, and many women with lupus have healthy pregnancies. <strong>Planning matters:</strong> conceiving while the disease is in remission reduces the risk of flares.</p><p>Some medicines are not safe in pregnancy, such as methotrexate, while hydroxychloroquine and prednisolone are considered safe. Plan with your rheumatologist and obstetric team wherever you can.</p>',
      f: ['women', 'treatment'], cta: { l: 'Pregnancy and motherhood', h: 'living-with-lupus.html#pregnancy' } },

    { id: 'women', k: 'women woman female why more men male gender who gets affected age',
      a: '<p>More than 90% of people with lupus are women, and women develop it around nine times more often than men. Hormonal factors are thought to be part of the reason.</p><p><strong>Men get lupus too</strong>, which is why it is missed in men even more often than in women. It most often begins between 15 and 45.</p>',
      f: ['causes', 'children'] },

    { id: 'children', k: 'children child kids young people teenager adolescent school paediatric son daughter',
      a: '<p>Lupus can begin in childhood and adolescence. Frequent absence and unpredictable illness make school hard, and young people are often misunderstood by teachers and classmates who cannot see what is wrong.</p><p>Schools that understand the condition make an enormous difference, and so do caregivers who are supported themselves.</p>',
      f: ['caregivers', 'support'] },

    { id: 'kidney', k: 'kidney kidneys nephritis renal urine protein dialysis failure',
      a: '<p>Lupus can affect the kidneys, which is called lupus nephritis. It can develop without obvious symptoms, which is why urine tests and monitoring matter so much.</p><p>Tell your clinician straight away about swelling in the legs, feet or around the eyes, foamy urine, or passing much less urine than usual.</p>',
      f: ['early', 'treatment'] },

    { id: 'caregivers', k: 'caregiver carer caring for someone family support partner husband wife mother father looking after',
      a: '<p>Caring for someone with lupus carries its own weight, and caregivers are often the last to ask for help.</p><p>LFA is forming a <strong>dedicated caregivers support group</strong> so the people holding everyone else up have somewhere of their own. If you are a caregiver, get in touch and we will include you.</p>',
      f: ['support', 'contact'], cta: { l: 'Caregiver support', h: 'get-involved.html#caregivers' } },

    { id: 'support', k: 'support group peer community meet others join connect talk someone lonely isolated near me chapter',
      a: '<p>Peer support is the thing our members say changed the most. In a support group you can describe a symptom without having to justify it.</p><p>We have chapters in Nairobi, Kisumu, Kiambu, Mombasa, Eldoret, Taita Taveta, Siaya, Homa Bay, Kakamega and Kericho, with members in seven countries.</p><p><strong>Call or WhatsApp us and we will connect you to the group nearest you.</strong> There is no form to fill in first.</p>',
      f: ['membership', 'contact'], cta: { l: 'Find a support group', h: 'get-involved.html#support-groups' } },

    { id: 'newly', k: 'newly just diagnosed new diagnosis what now where do i start first steps scared overwhelmed',
      a: '<p>First: <strong>you do not have to do everything today.</strong></p><p>The five steps our members found most useful, in order:</p><ul><li>Learn what lupus actually is</li><li>Find support from people who understand</li><li>Understand your treatment and what to ask</li><li>Connect with other warriors near you</li><li>Take care of your mental wellbeing</li></ul>',
      f: ['support', 'what', 'mental'], cta: { l: 'Open the starting guide', h: 'newly-diagnosed.html' } },

    { id: 'cost', k: 'cost costly expensive afford money pay price insurance cover sha nhif financial cannot afford medicine',
      a: '<p>You are not alone in this, and it does not mean you have to give up.</p><p>Talk to your provider about the challenges directly and ask about affordable medicines, payment arrangements or referral services. Connecting with a patient group also helps, because practical knowledge about what is available travels fastest through the community.</p><p>LFA advocates for health insurance coverage and access to essential medicines, including engagement with the Social Health Authority.</p>',
      f: ['advocacy', 'support'], cta: { l: 'What we advocate for', h: 'advocacy.html' } },

    { id: 'advocacy', k: 'advocacy policy government campaign petition rights lobbying change law take action',
      a: '<p>We advocate for early diagnosis, affordable treatment, access to essential medicines, health insurance coverage, patient-centred care, mental health support, and meaningful participation of patients in health policy.</p><p>You can add your voice: sign a petition, write to your representative, join a campaign, or simply share our work.</p>',
      f: ['cost', 'membership'], cta: { l: 'Take action', h: 'advocacy.html#take-action' } },

    { id: 'membership', k: 'member membership join sign up register become part how do i join',
      a: '<p>Membership is <strong>free</strong> and open to people living with lupus, caregivers, family members and supporters. It connects you to peer support, information and chapter activities.</p><p>More than 600 warriors and caregivers across seven countries have joined.</p>',
      f: ['support', 'volunteer'], cta: { l: 'Become a member', h: 'get-involved.html' } },

    { id: 'volunteer', k: 'volunteer help out give time assist support lfa work with you',
      a: '<p>Our events, campaigns and chapter activities run on volunteers. We need help with awareness events, community outreach, communications, translation, photography, logistics and administration.</p><p>You do not need to have lupus to volunteer, and you do not need a lot of time.</p>',
      f: ['membership', 'donate'], cta: { l: 'Volunteer with us', h: 'get-involved.html#volunteer' } },

    { id: 'donate', k: 'donate donation give money support funding contribute sponsor fundraise mpesa paybill',
      a: '<p>Thank you. Donations keep support groups, awareness work and patient assistance running.</p><p>We deliberately do not publish payment details on the website, because donation pages are a common target for impersonation. <strong>Please contact us directly and we will confirm the current options and send you a receipt.</strong></p>',
      f: ['contact', 'partner'], cta: { l: 'Ways to give', h: 'donate.html' } },

    { id: 'shop', k: 'shop merchandise merch buy purchase tshirt t-shirt shirt hoodie hoodies notebook store order wear',
      a: '<p>Yes. The <strong>LFA shop</strong> sells Lupus Warrior hoodies and T-shirts, the Steps for Change T-shirt from World Lupus Day 2026, and the Lupus Warrior notebook.</p><p>Add items to your cart and check out on the website. You can pay by M-Pesa, by card, or when you collect in Nairobi, and our team confirms every order with you before you pay. Proceeds support our work.</p>',
      f: ['donate', 'contact'], cta: { l: 'Visit the shop', h: 'shop.html' } },

    { id: 'partner', k: 'partner partnership organisation company corporate sponsor collaborate business hospital media pharmaceutical',
      a: '<p>We work with healthcare, corporate, research, media, pharmaceutical, donor and event partners. Current partners include Aga Khan University Hospital, Mater Hospital, Kenyatta National Hospital, Nairobi Arthritis Clinic, Vimbo Health, AAR Healthcare, Citizen TV, NTV Kenya and KBC.</p>',
      f: ['contact', 'research'], cta: { l: 'Partner with us', h: 'partner-with-us.html' } },

    { id: 'about', k: 'about lfa who are you organisation foundation history founded mission vision what do you do',
      a: '<p>The Lupus Foundation of Africa is an <strong>African patient-led, patient-centred organisation</strong> founded in 2013.</p><p>We work so that every person living with lupus is seen, heard, diagnosed early, treated appropriately and supported to live a full and dignified life. We do that through awareness and advocacy, patient voice and research, and patient support and access to care.</p>',
      f: ['membership', 'advocacy'], cta: { l: 'About LFA', h: 'about.html' } },

    { id: 'research', k: 'research study evidence registry data science researcher academic university trial',
      a: '<p>Most of what is known about lupus was not learned in Africa, yet guidance and financing decisions are built on that evidence. We work to close that gap, with patients as partners rather than subjects.</p><p>If you are a researcher studying lupus in Africa, we would like to hear from you.</p>',
      f: ['professionals', 'contact'], cta: { l: 'Research at LFA', h: 'research.html' } },

    { id: 'professionals', k: 'doctor clinician nurse health professional medical practitioner refer training clinic laboratory',
      a: '<p>We have a section for health professionals covering earlier recognition, referral, patient management and how to work with us on training, patient resources and research.</p><p>Consider lupus when symptoms <strong>come and go, recur over months, and cross organ systems</strong>, especially in a woman aged 15 to 45 who has already been treated for several unrelated diagnoses.</p>',
      f: ['research', 'contact'], cta: { l: 'For health professionals', h: 'for-professionals.html' } },

    { id: 'stories', k: 'stories story warrior experience testimony others people like me real inspire hope',
      a: '<p>We publish stories from warriors and caregivers in their own words, with their consent. Isabella, Nyambura, Purity and Gloria have each shared theirs, and most of the people who run LFA live with lupus themselves.</p><p>For many newly diagnosed people, reading someone else\'s story is the moment it stops feeling isolating.</p>',
      f: ['newly', 'support'], cta: { l: 'Read the stories', h: 'stories.html' } },

    { id: 'myths', k: 'myth myths misconception false true fact wrong believe stigma looks fine',
      a: '<p>The ones that do the most damage:</p><ul><li><strong>"It is contagious"</strong> - it is not, at all.</li><li><strong>"If you look fine you are fine"</strong> - the worst symptoms are invisible.</li><li><strong>"It is witchcraft"</strong> - it is a medical condition.</li><li><strong>"Your life is over"</strong> - people live and thrive with lupus.</li><li><strong>"You can stop medicine when you feel better"</strong> - that causes flares.</li></ul>',
      f: ['contagious', 'cure'], cta: { l: 'Myths and facts', h: 'living-with-lupus.html#myths' } },

    { id: 'events', k: 'event events world lupus day campaign walk wellness day meetup gallery photos when',
      a: '<p>Our flagship campaign is <strong>World Lupus Day</strong>. In 2026 we walked through Nairobi with the Aga Khan University Hospital under the message "Make Lupus Visible", followed by a wellness and education programme and a patient pledge wall.</p><p>We also run wellness days, patient meet-ups, hospital visits and awareness campaigns through the year.</p>',
      f: ['membership', 'stories'], cta: { l: 'Events and gallery', h: 'events.html' } },

    { id: 'contact', k: 'contact reach call phone email whatsapp talk human speak person address office where located nairobi',
      a: '<p>You can reach the LFA team directly:</p><ul><li><strong>Phone:</strong> <a href="tel:' + PHONE + '">' + PHONE_DISPLAY + '</a></li><li><strong>WhatsApp:</strong> <a href="' + WHATSAPP + '" target="_blank" rel="noopener">message us</a></li><li><strong>Email:</strong> <a href="mailto:info@lupusfa.org">info@lupusfa.org</a></li></ul><p>We are based in Nairobi, Kenya, with chapters across the country.</p>',
      f: ['support', 'membership'], cta: { l: 'Contact page', h: 'contact.html' } }
  ];

  var GREET = /^(hi|hello|hey|hae|habari|jambo|sasa|good (morning|afternoon|evening)|niaje)\b/i;
  var THANKS = /(thank|thanks|asante|appreciate|helpful)/i;
  var BYE = /^(bye|goodbye|see you|that'?s all|nothing else)\b/i;

  var URGENT = /(chest pain|can'?t breathe|cannot breathe|difficulty breathing|trouble breathing|seizure|fitting|convulsion|confus|severe headache|worst headache|blood in (my )?urine|not passing urine|no urine|coughing blood|high fever|collaps|faint(ed|ing)|stroke)/i;
  var CRISIS = /(kill myself|killing myself|suicide|suicidal|end my life|want to die|don'?t want to live|harm myself|hurt myself|self.?harm|no reason to live)/i;

  /* ------------------------------------------------------------- Matching */
  function byId(id) {
    for (var i = 0; i < KB.length; i++) if (KB[i].id === id) return KB[i];
    return null;
  }

  function tokens(s) {
    return s.toLowerCase().replace(/[^a-z0-9\s']/g, ' ').split(/\s+/)
      .filter(function (w) { return w.length > 2 && STOP.indexOf(w) === -1; });
  }
  var STOP = ['the','and','for','you','are','can','what','how','does','did','was','with','this','that','have','has','but','not','all','any','get','got','out','about','from','they','them','its','his','her','our','your','who','why','when','where','will','would','could','should','there','here','than','then','into','over','more','most','some','very','just','like','know','tell','say','said','one','two','also','been','being','were','iam','ive'];

  /* Multi-word phrases that point strongly at one topic. These beat single
     keywords, so "passed to my children" reaches heredity rather than the
     children topic, and "how much does it cost" reaches affordability. */
  var PHRASES = {
    causes:    ['pass it on','passed to my','pass to my','give it to my','hereditary','inherit','runs in the family','run in the family','run in my family','genetic','from my mother','from my father'],
    cost:      ['how much','cost','costs','afford','expensive','cheaper','price','pay for','paying for','money for','cover the'],
    fatigue:   ['tired all the time','so tired','always tired','very tired','no energy','exhausted','worn out','brain fog'],
    pregnancy: ['pregnant','having a baby','trying for a baby','conceive','breastfeed'],
    kidney:    ['kidney','kidneys','nephritis','my urine'],
    stopping:  ['stop taking','stop my medic','quit my medic','skip my medic','stopped taking'],
    contagious:['catch it','catch lupus','contagious','infectious','spread it'],
    support:   ['support group','near me','meet other','talk to other','someone like me'],
    newly:     ['just been diagnosed','just diagnosed','newly diagnosed','was diagnosed','what do i do now','where do i start'],
    contact:   ['talk to a person','speak to someone','real person','human','phone number','call you','reach you'],
    tool:      ['do i have lupus','think i have lupus','might have lupus','could i have lupus'],
    shop:      ['hoodie','hoodies','t-shirt','t-shirts','tshirt','t shirt','notebook','merch','merchandise','the shop','your shop','buy a','buy the','buy some']
  };

  function phraseHit(raw) {
    var low = ' ' + raw.toLowerCase() + ' ';
    var hit = null;
    Object.keys(PHRASES).forEach(function (id) {
      PHRASES[id].forEach(function (ph) {
        var len = ph.length + (id === 'shop' ? 20 : 0);
        if (low.indexOf(ph) > -1 && (!hit || len > hit.len)) hit = { id: id, len: len };
      });
    });
    return hit;
  }

  function best(input) {
    var ph = phraseHit(input);
    if (ph) { var e = byId(ph.id); if (e) return { e: e, score: 99 }; }
    var t = tokens(input);
    if (!t.length) return null;
    var scored = KB.map(function (e) {
      var keys = e.k.split(' ');
      var score = 0;
      t.forEach(function (w) {
        keys.forEach(function (k) {
          if (k === w) score += 3;
          else if (k.length > 3 && w.length > 3 && (k.indexOf(w) === 0 || w.indexOf(k) === 0)) score += 2;
          else if (k.length > 4 && w.length > 4 && k.indexOf(w) > -1) score += 1;
        });
      });
      return { e: e, score: score };
    }).sort(function (a, b) { return b.score - a.score; });
    return scored[0].score >= 3 ? scored[0] : null;
  }

  /* ------------------------------------------------------------- Interface */
  function init() {
    var launch = document.getElementById('chat-launch');
    var panel = document.getElementById('chat');
    if (!launch || !panel) return;

    var log = document.getElementById('chat-log');
    var chips = document.getElementById('chat-chips');
    var form = document.getElementById('chat-form');
    var input = document.getElementById('chat-input');
    var closeBtn = document.getElementById('chat-close');
    var started = false, busy = false, lastFocus = null;
    var history = [];

    function open() {
      lastFocus = document.activeElement;
      panel.classList.add('is-open');
      launch.classList.add('is-hidden');
      launch.setAttribute('aria-expanded', 'true');
      if (!started) { started = true; greet(); }
      setTimeout(function () { input.focus(); }, 320);
    }
    function close() {
      panel.classList.remove('is-open');
      launch.classList.remove('is-hidden');
      launch.setAttribute('aria-expanded', 'false');
      if (lastFocus) lastFocus.focus(); else launch.focus();
    }

    launch.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
    });

    // scrollHeight is stale until the new node has been laid out
    function toBottom() {
      requestAnimationFrame(function () { log.scrollTop = log.scrollHeight; });
    }

    function bubble(html, cls) {
      var d = document.createElement('div');
      d.className = 'chat-msg ' + cls;
      d.innerHTML = html;
      log.appendChild(d);
      toBottom();
      return d;
    }

    function setChips(list) {
      chips.innerHTML = '';
      list.forEach(function (item) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chat-chip';
        b.textContent = item.label;
        b.addEventListener('click', function () {
          say(item.label);
          respond(item.id ? byId(item.id) : null, item.label);
        });
        chips.appendChild(b);
      });
    }

    function say(text) {
      bubble(escapeHtml(text), 'chat-you');
      history.push({ role: 'user', text: text });
    }

    function think(ms, done) {
      busy = true;
      chips.innerHTML = '';
      var t = document.createElement('div');
      t.className = 'chat-typing';
      t.innerHTML = '<i></i><i></i><i></i>';
      t.setAttribute('aria-label', 'Typing');
      log.appendChild(t);
      toBottom();
      setTimeout(function () { t.remove(); busy = false; done(); }, ms);
    }

    function greet() {
      think(500, function () {
        bubble('<p>Hello, and welcome. I am the LFA assistant, here to help you learn about lupus.</p><p>Ask me anything in your own words, or pick a starting point below.</p>', 'chat-bot');
        bubble('I share general information only. I cannot diagnose you or give medical advice, and I am not a replacement for your doctor.', 'chat-note');
        setChips([
          { id: 'what', label: 'What is lupus?' },
          { id: 'symptoms', label: 'What are the symptoms?' },
          { id: 'newly', label: 'I was just diagnosed' },
          { id: 'support', label: 'Find a support group' },
          { id: 'contact', label: 'Talk to a person' }
        ]);
      });
    }

    function respond(entry, raw) {
      var delay = 420 + Math.min(900, (entry ? entry.a.length : 200) * 1.1);

      if (CRISIS.test(raw)) {
        return think(600, function () {
          bubble('<p><strong>I am really glad you told me, and I am sorry you are carrying this.</strong></p><p>Please reach out to someone today: a healthcare professional, or someone you trust. You can also call or WhatsApp the LFA team on <a href="tel:' + PHONE + '">' + PHONE_DISPLAY + '</a> and we will help you find support.</p><p>You do not have to manage this on your own.</p>', 'chat-alert');
          setChips([{ id: 'mental', label: 'Lupus and mental health' }, { id: 'support', label: 'Find peer support' }]);
        });
      }

      if (URGENT.test(raw)) {
        return think(600, function () {
          bubble('<p><strong>What you have described needs urgent medical attention, not a website.</strong></p><p>Please go to your nearest health facility or contact a healthcare professional now. Do not wait for a routine appointment.</p>', 'chat-alert');
          setChips([{ id: 'symptoms', label: 'Other lupus symptoms' }, { id: 'contact', label: 'Contact LFA' }]);
        });
      }

      if (!entry && GREET.test(raw)) {
        return think(380, function () {
          bubble('<p>Hello. What would you like to know about lupus?</p>', 'chat-bot');
          suggest();
        });
      }
      if (!entry && THANKS.test(raw)) {
        return think(380, function () {
          bubble('<p>You are very welcome. Is there anything else I can help with?</p>', 'chat-bot');
          suggest();
        });
      }
      if (!entry && BYE.test(raw)) {
        return think(380, function () {
          bubble('<p>Take care of yourself. Remember you are not alone in this, and the LFA team is on <a href="tel:' + PHONE + '">' + PHONE_DISPLAY + '</a> whenever you need us.</p>', 'chat-bot');
          suggest();
        });
      }

      if (!entry) return fallback(raw);

      think(delay, function () {
        var html = entry.a;
        if (entry.cta) html += '<p><a href="' + entry.cta.h + '">' + entry.cta.l + ' &rarr;</a></p>';
        bubble(html, 'chat-bot');
        history.push({ role: 'bot', text: entry.id });
        var next = (entry.f || []).map(function (id) {
          var e = byId(id);
          return e ? { id: id, label: firstQuestion(e) } : null;
        }).filter(Boolean);
        next.push({ id: 'contact', label: 'Talk to a person' });
        setChips(next);
      });
    }

    function firstQuestion(e) {
      var L = {
        what: 'What is lupus?', symptoms: 'Symptoms', tool: 'Symptom tool', causes: 'What causes it?',
        contagious: 'Is it contagious?', diagnosis: 'How is it diagnosed?', early: 'Why diagnose early?',
        treatment: 'Treatment options', stopping: 'Can I stop my medicine?', cure: 'Is there a cure?',
        flares: 'What is a flare?', fatigue: 'Coping with fatigue', sun: 'Sun sensitivity', diet: 'Diet and food',
        living: 'Living well', mental: 'Mental health', work: 'Lupus and work', pregnancy: 'Pregnancy',
        women: 'Why mostly women?', children: 'Children and lupus', kidney: 'Kidneys', caregivers: 'For caregivers',
        support: 'Support groups', newly: 'Just diagnosed', cost: 'Affording care', advocacy: 'Advocacy',
        membership: 'Become a member', volunteer: 'Volunteer', donate: 'Donate', partner: 'Partnerships',
        about: 'About LFA', research: 'Research', professionals: 'For clinicians', stories: 'Warrior stories',
        myths: 'Myths and facts', events: 'Events', shop: 'Visit the shop', contact: 'Contact LFA'
      };
      return L[e.id] || e.id;
    }

    function suggest() {
      setChips([
        { id: 'what', label: 'What is lupus?' },
        { id: 'symptoms', label: 'Symptoms' },
        { id: 'treatment', label: 'Treatment' },
        { id: 'support', label: 'Support groups' },
        { id: 'contact', label: 'Talk to a person' }
      ]);
    }

    function fallback(raw) {
      // With a backend configured, hand anything unmatched to it.
      if (CHAT_ENDPOINT) {
        return think(500, function () {
          fetch(CHAT_ENDPOINT, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: raw, history: history.slice(-8) })
          })
            .then(function (r) { return r.json(); })
            .then(function (d) {
              bubble(d && d.reply ? d.reply : notSure(), 'chat-bot');
              suggest();
            })
            .catch(function () { bubble(notSure(), 'chat-bot'); suggest(); });
        });
      }
      think(600, function () {
        bubble(notSure(), 'chat-bot');
        suggest();
      });
    }

    function notSure() {
      return '<p>I am not sure I have a good answer for that one, and I would rather say so than guess.</p>' +
        '<p>Try asking in different words, pick a topic below, or speak to the LFA team directly on <a href="tel:' + PHONE + '">' + PHONE_DISPLAY + '</a> or <a href="' + WHATSAPP + '" target="_blank" rel="noopener">WhatsApp</a>. A real person will always give you a better answer than I can.</p>';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v || busy) return;
      input.value = '';
      say(v);
      var m = best(v);
      respond(m ? m.e : null, v);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
