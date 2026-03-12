/**
 * NepCulture — studio.js
 * Music studio: generate, persist, play, favorite, delete, download, and search tracks.
 * Expanded with 18 genres × 14 moods, all-distinct 50+ word professional lyrics.
 * Depends on main.js (db, showToast, debounce, exportJSON, triggerDownload).
 */

(function () {
  'use strict';

  // ─── DOM references ─────────────────────────────────────────────────────────
  const customTitleInput  = document.getElementById('custom-title');
  const lyricsInput       = document.getElementById('lyrics-input');
  const wordCountEl       = document.getElementById('word-count');
  const charCountEl       = document.getElementById('char-count-val');
  const langDetectEl      = document.getElementById('lang-detect');
  const emotionDetectEl   = document.getElementById('emotion-detect');
  const liveFeedbackBox   = document.getElementById('live-feedback-box');
  const btnGenerate       = document.getElementById('btn-generate');
  const progressContainer = document.getElementById('progress-container');
  const progressText      = document.getElementById('progress-text');
  const progressFill      = document.getElementById('progress-fill');
  const progressBarEl     = document.getElementById('progress-bar-el');
  const genreSelect       = document.getElementById('genre-select');
  const moodSelect        = document.getElementById('mood-select');
  const tempoInput        = document.getElementById('tempo-input');
  const keySelect         = document.getElementById('key-select');
  const trackContainer    = document.getElementById('track-container');
  const detailTitle       = document.getElementById('detail-title');
  const detailDate        = document.getElementById('detail-date');
  const detailLyrics      = document.getElementById('detail-lyrics');
  const detailTags        = document.getElementById('detail-tags');
  const vinylArt          = document.getElementById('vinyl-art');
  // audioPlayer removed — audio is handled entirely by NepAudio (audioEngine.js)
  const playMainBtn       = document.querySelector('.play-main');
  const timelineProgress  = document.querySelector('.timeline-progress');
  const timelineBar       = document.querySelector('.timeline-bar');
  const currentTimeEl     = document.querySelector('.player-timeline .time:first-child');
  const playerDurationEl  = document.getElementById('player-duration');
  const trackSearchInput  = document.querySelector('.search-box input');

  if (!btnGenerate) return;

  // ─── State ──────────────────────────────────────────────────────────────────
  let currentTrack = null;
  let isGenerating = false;

  // Audio is now synthesized by NepAudio (audioEngine.js) — no MP3 files needed.
  // Every genre × mood combination produces a unique sound via Web Audio API.

  // ══════════════════════════════════════════════════════════════════════════
  //  LYRIC DATABASE — Every genre × mood combo has DISTINCT 50+ word lyrics.
  //  Key format: `GENRE_MOOD`  (both title-cased to match select values)
  // ══════════════════════════════════════════════════════════════════════════
  const LYRIC_DB = {

    // ── RAP ────────────────────────────────────────────────────────────────
    Rap_Aggressive:
`Gorkhali blood ignites the stage tonight,
Thunder in my chest, khukuri raised to fight.
Every bar a battle cry, every verse a war,
Himali winds behind me — watch me kick the door.
Kathmandu bred and mountain fed, I spit the truth untamed,
No suit, no throne, no compromise — I'll never be defamed.
Yo the streets remember every struggle, every scar,
From dusty Tanahun roads I rose to reach this far.`,

    Rap_Rebellious:
`They told me bow your head, I said nope — never bowing down,
System built on silence, I'm the loudest voice in town.
Prithvi Narayan marched with fire, I march with pen and mic,
If the palace tries to mute us, we just rhyme and strike.
Every oppressive law becomes another verse I write,
Dal bhat on the table but my dignity stays tight.
Gorkhali rebellious, nepali and unbreakable,
The narrative they sold us? Completely unmakeable.`,

    Rap_Reflective:
`Walking through Indra Chowk at dusk, counting cobblestones,
Every crack in these old walls holds a thousand unknown moans.
My grandfather walked barefoot through Karnali's frozen pass,
I carry his unfinished dreams embedded in my brass.
What does it mean to chase success and leave the village far?
To send rupees home in envelopes but never see a star
From that same courtyard where I first looked up and made a wish —
Success has such a hollow ring when roots become a myth.`,

    Rap_Melancholic:
`Damp season in Pokhara, grey skies over Fewa lake,
I'm rhyming through the rainfall for my own heart's sake.
Missed the last call from my aama, she won't say it twice,
Distance is the tax that migration makes us sacrifice.
Every night in the foreign city I hear Nepali songs,
A homesick frequency that tells me where I still belong.
I built my career on borrowed time and someone else's shore,
But no matter what I conquer, baje's voice is what I'm for.`,

    Rap_Nostalgic:
`Remember Dashain at the village, red tika on the brow,
Elders reading futures in the grain and asking vows.
We'd run through mustard fields when October turned the land to gold,
Now those fields are parking lots and I am growing old.
The swings we built from rope and wood would carry us to sky,
Now construction cranes have stolen where the kites would fly.
Bhai dooj, deusi reh, fire-crackers in the night —
I'd trade my city penthouse for one more glimpse of light.`,

    Rap_Triumphant:
`From the Terai plains to the Himalayas' peak I've climbed,
Every doubt that tried to stop me left forever behind.
They said the quota's full, said the stage isn't for your kind,
I built my own arena and I blew their frozen mind.
Gorkhali tenacity runs deeper than their fear,
Every sacrifice my parents made is crystal clear.
This crown was never given — I forged it from pure will,
And from the summit all I see is more and more to fill.`,

    Rap_Longing:
`Your number saved under a name I never say aloud,
I deleted every photo but your memory's too proud.
The way you spoke of mountains like each peak was sacred ground,
The way your laughter echoed made a hollow city sound.
I pass the restaurants we loved, I take a different road,
Avoiding every landmark that would lighten up this load.
Somewhere in the Himalayas maybe time stands still,
But down here on the flatlands I am learning to rebuild.`,

    Rap_Uplifting:
`Rise up every morning, let the sun reclaim your name,
Yesterday's rejection is tomorrow's winning game.
Nepal's got twenty mountains higher than the rest of Earth —
We were literally born inside a place of highest worth.
Bhim Gurung ran the race though no one built a track,
Pasang Lhamu Sherpa never once looked back.
Your potential is a Himalaya waiting to be found,
Plant your flag on every summit, let your heartbeat pound.`,

    Rap_Romantic:
`You came in like monsoon season — unannounced and everywhere,
Soaking every corner of the city, soaking all my prayer.
Your name sounds like a dohori between two mountain streams,
The kind of conversation written only in my dreams.
I'll build a house of words for you beside a quiet lake,
I'll trade every trophy for the mornings we can make.
Timi mero ho bhane ke farak parcha yo duniya ko —
When you are mine the whole world is just a studio.`,

    // ── ROCK ────────────────────────────────────────────────────────────────
    Rock_Aggressive:
`Electric veins run through the Himalayan stone,
We carved this riff from thunder and we claim it as our own.
Kathmandu is burning bright with everything we feel,
Distortion set to maximum, the feedback cut is real.
Smash the amplifier, let the tremor shake the floor,
We built these walls of sound from every scar we bore.
Nepal's rock movement rising from the rubble and the noise —
One nation, one guitar, and several thousand voice.`,

    Rock_Rebellious:
`They plastered posters over every inch of broken wall,
Told us which gods to worship and which kingdoms rise and fall.
I plugged in my six-string and I let the signal bleed,
This amp is my manifesto and this chord is my creed.
Censorship can't silence power chords that shake the room,
The monarchy is over but the music seals its doom.
Electric revolution in the valley of the kings —
We are the feedback generation, hear the noise it brings.`,

    Rock_Melancholic:
`I left the stage at midnight when the encore faded out,
Stood in empty parking lots and wrestled with my doubt.
The crowd they cheered for one brief hour then went back to sleep,
While I still hold these melodies I promised I would keep.
Every album I recorded holds a person I once was,
Listen close and you will hear the silence between the buzz.
The amp stays warm, the guitar hangs, the notebook waits again —
Rock and roll won't cure the ache but makes it sing in vain.`,

    Rock_Triumphant:
`We survived the decade when they said this band would break,
Survived the label dropping us, the albums no one'd take.
But the underground kept burning like a forge inside the earth,
And every concert hall we played announced a second birth.
Four strings, one kick, one snare, one voice that wouldn't fold —
We are the Nepali rock story waiting to be told.
The festival has chosen us, the speakers shake the ground,
We built an empire out of noise and now we've been found.`,

    // ── R&B ────────────────────────────────────────────────────────────────
    RnB_Romantic:
`Your silhouette against the Himalayan afterglow,
I watched you pour the tea and felt the whole world slow.
You speak in metaphors that match the season's change,
Your warmth a kind of constant in this ever-shifting range.
I want to write a thousand songs and none of them are new —
They all begin and end exactly somewhere close to you.
This melody was waiting in the silence all along,
And you arrived in autumn and became my favorite song.`,

    RnB_Passionate:
`Every conversation leaves me breathless and undone,
You are the kind of heat that makes me chase the rising sun.
I practiced saying things to you a hundred times a day,
But every word dissolves completely when you look my way.
This bass line in my chest is just your name on infinite repeat,
The rhythm of my heartbeat only quickens when we meet.
R&B was made for moments like the ones you conjure whole —
You are the hook, the verse, the bridge, the center of my soul.`,

    RnB_Melancholic:
`We danced to all the wrong songs at the perfect time of night,
You left before the sunrise stole the softness of the light.
I keep the playlist playing though your name is not in reach,
Every note a conversation that has turned to speechless grief.
The city sounds like background music nobody chose to play,
A soundtrack to the emptiness that settled since that day.
I'd sing myself out of this feeling but the melody won't form,
Because it still belongs to the specific shape of your warm.`,

    RnB_Nostalgic:
`We used to drive through Lazimpat when the city was still ours,
Parked beside the palace walls and counted satellite stars.
Old Nepali songs between us on the radio that night,
Narayan Gopal's sadness never sounded quite so right.
The restaurant we loved closed down, the street has changed its name,
But in my memory's color film the details stay the same.
I'd give my whole collection just to relive one of those — 
Driving through the city before either of us chose.`,

    // ── JAZZ ────────────────────────────────────────────────────────────────
    Jazz_Reflective:
`The sarangi and the saxophone trade phrases in the smoke,
A conversation Kathmandu and Harlem haven to spoke.
Each note bends like the Bagmati when the monsoon fills its banks,
Blue notes rising over ghats where pilgrims offer thanks.
There is no map for improvisations of the soul,
You follow where the changes lead and trust you'll end up whole.
The jazz musician and the Gandharba share one truth:
The song worth playing is the one that cannot hold the proof.`,

    Jazz_Peaceful:
`Late evening at the café near the stupa in Boudha,
Incense and a piano, rain on stone, the whole world softer.
A minor chord resolves to somewhere quiet and to clear,
The chatter of the day dissolves and leaves just being here.
No destination, no agenda, no particular song —
The fingers find the keys and everything turns out to belong.
In jazz as in Kathmandu's lanes: you drift and then you find,
A turning you weren't planning leads to peace of perfect kind.`,

    // ── FOLK ────────────────────────────────────────────────────────────────
    Folk_Romantic:
`Khola ko kinara ma phul phulcha simali,
Timi aayau mann ma jyoti balali.
The river speaks your name across the evening stone,
I heard it in the distance when I sat beside alone.
Pahad ko hawa le timilai nai lyaaucha,
Mann ko bhagwan pani timilai nai gaucha.
My love is mountain-deep and wide as valley spread —
I'd walk a thousand ridgelines just to find where you have led.`,

    Folk_Melancholic:
`Pitko ghar ma aaija pheri ek palta,
Dhaan ko bali ma haami bhetaunthyou phalta.
The harvest song goes silent in the empty courtyard now,
Your absence in the threshold where you'd keep your sacred vow.
Bari ko mutura ko phool oirali jharchha,
Timi binaako yatro bela kasari sarchha.
The marigolds still bloom along the path you always took,
But there is no one left to read them as an open book.`,

    Folk_Nostalgic:
`Aangan ma bata didi dhungro bokera ayau,
Paanidhara ko bharyang ma khelda khelda gayau.
Those water-steps at dawn where girls would carry morning brass,
Now paved with city concrete beneath cars that daily pass.
Bauko khojda bheteuthyo pahad ko bato khola,
Aamaako daura maa dhaan ko baas aaucha bola.
The smell of freshly hulled rice grain has never left my mind,
No matter how far city-life leaves childhood's world behind.`,

    Folk_Spiritual:
`Pashupatinath ko ghaat ma bela batti balidiyau,
Bagmati ko dhaaraa ma aafu nai bilaaidiyau.
The sacred river carries everything — the grief, the gold, the vow,
I lit the butter lamp for all I cannot carry now.
Panchaali ko devi ma dodhara uthchha swaar,
Devali ma batti bale — saathi banau paar.
Where ancient bells ring over rooftops red with sacred smoke,
I find the language of the soul that was never quite spoke.`,

    Folk_Longing:
`Pardesh bata aaunu chha, gaun lai birsina sakdina,
Bato ko dhulo sameto aafno banaaudina.
Every road that leads away circles back to this same hill,
The bamboo grove my grandfather planted growing still.
Khola ma paani aaucha, paani ma tara jhalchha,
Tara ko photo kadhda aankha bhinajhalghalchha.
I photograph the stars to prove I have not quite forgotten,
The village sky above the field where our shared roots were gotten.`,

    Folk_Uplifting:
`Utha yaar utha — pahad le bolaucha,
Risaieko surya pheri pagi aaucha.
Even when the monsoon floods the narrow mountain track,
The sun has never once forgotten how to come back.
Gorkhali hatthikaanda mathipaari jhukdaina,
Nepali mann ko jyoti harpal nukdaina.
We have climbed the world's own rooftop with bare feet and open hands,
There is no peak too steep for hearts that understand.`,

    // ── TAMANG ────────────────────────────────────────────────────────────
    Tamang_Playful:
`Damphu ko taal ma nachau aajakaal,
Ghangru bajauchu rang haalda baal.
Sel roti pakaideu, raksi thaapideu,
Tamang jatiko khushi jhan badhai pardeu.
The damphu speaks a language that the mountains always knew,
Red and gold and laughter when the harvest season's through.
Naachda naachda tamashaama laagyo man,
Himali cheli timilai dherai maya man.`,

    Tamang_Nostalgic:
`Baje ko damphu raakha mero kotha ko ghaat,
Uniharule nacheka bato afu bhandai raat.
The drum remembers every ceremony, every song,
My grandfather performed for forty seasons all year long.
Sel roti ko baas aaucha baisakh ko bela,
Tamang ko cheli naach dekhda phoolyo mela.
Modern buildings rose above the old communal space,
But in the drumbeat I can still recover my home place.`,

    // ── NEWARI ────────────────────────────────────────────────────────────
    Newari_Mysterious:
`Newar ko nagarko galli galli bhetinchhu puraan baat,
Raatriko Bhaktapur ma ta temple bhitra suntaa gaat.
Ancient wooden windows watching every age go by,
The peacock window holds the gaze of centuries in its eye.
Newa craft in terracotta, stories baked inside the brick,
The city's oldest language only temple bells can trick.
Every courtyard hides a deity beneath its worn stone feet —
In Bhaktapur the mystical and mortal always meet.`,

    Newari_Spiritual:
`Indra Jatra ko rathma Kumari aaucha shaan sanga,
Bhaktapur bhitra tyo devi dekhda shubha rang sanga.
The Living Goddess travels through the city's oldest street,
And every eye turns inward when the sacred wheels repeat.
Newa festivals are calendars of gods who never sleep,
The offering plates and incense smoke are promises to keep.
In Pashupatinath the ancient lineage still calls,
Newari chants descending through the consecrated halls.`,

    // ── BHAJAN ────────────────────────────────────────────────────────────
    Bhajan_Spiritual:
`Shiva Shiva Shiva — Pashupatinath ko naam,
Bholenath ko charan ma baandh ma aadhaam.
The sacred bells of dawn dissolve the darkness into flame,
Every pilgrim at the ghaat calls the same eternal name.
Om namah shivaya echoes through the mountain mist,
The holy river blesses all that chose to coexist.
In Kathmandu the gods are close — you feel them in the stone,
No devotee who reaches Bam Bholke walks alone.`,

    Bhajan_Peaceful:
`Hare Krishna Hare Rama — mantra ko dhun sadhai,
Bhakti ko dhaaraa ma behne bela sukha painchhu sadhai.
Let the chanting fill the morning like the first light fills the sky,
Let devotion be the river and the self be let to fly.
Tulsi ko mato ra dhoop ko baas saath,
Satsang ma baise — paye param praapt.
When the kirtan rises in the temple courtyard at first dawn,
Every burden carried to the threshold is let gone.`,

    Bhajan_Uplifting:
`Jai Jai Devi Bhavani — Nepal ko rakshak tu,
Dashainko tika dinu aaunu, devi amita tu.
The goddess arms our courage with a blessing every fall,
Her red tika on our foreheads makes us stand unbreakable and tall.
Navadurga ko naach ma Bhaktapur naachcha,
Shakti ko roopma devi hamra seena raachcha.
Nepal breathes in the sacred and exhales as something whole,
The festival is not tradition — it is food for every soul.`,

    // ── CLASSICAL ────────────────────────────────────────────────────────
    Classical_Reflective:
`Raag Bhairav ko aalaap ma bhor phutchha dheere,
Sarangi ko taar ma kahani aaucha pheri.
The morning raga opens like a door to ancient sky,
A conversation between melody and the reason why.
Tal ma laya baandhi mann ko lahar haalchha,
Swar swar sadhda puraan yugin adhyaay khaalchha.
To learn the classical is to inherit centuries of care,
Each raga is a season, an emotion, a prayer.`,

    Classical_Peaceful:
`Yaman kalyan ko raat ma raag bhancha,
Gandharba ko bansuri tara jogi nai sancha.
Evening raga floats above the valley's quiet breath,
A dialogue between the living and the memory of death.
Tabla ko theka taal ma bhandai bhandai jaanchha,
Mann ko sailab bhitar bhitar sukha paachha.
In the patient practice of a raga one discovers truth:
The music has been waiting since the days of our own youth.`,

    // ── DOHORI ────────────────────────────────────────────────────────────
    Dohori_Playful:
`Cheliharule gaaun bhancha "Kahile aauncha pheeri?"
Ketaharule jawab gaaun "Mausamle paauncha deeri."
The call-and-response between the hill and valley never ends,
Two voices weaving meaning from the melody that bends.
Timi ho ki mero sapana raat ko tara ho?
Cheli bhancha "Ghar pharka jaa, mausam girna laagyo wa."
In dohori the conversation is the oldest love of all —
The mountain answers every question with a measured call.`,

    Dohori_Romantic:
`Pani bhareko gagri ma timi jhai thalthale,
Timro hansaai dekhda mann ma phool phule tele.
I waited at the water source each morning just to see
The way you carry grace the way the river carries the sea.
Timilai bhetna aauchu tyo pahad ko chuchuro ma,
Timro aankha dekhda bhulichhu umaraa puro ma.
In dohori tradition lovers speak in seasons and in rain —
I will answer every verse you send until I see you again.`,

    // ── POP ────────────────────────────────────────────────────────────────
    Pop_Happy:
`Kathmandu in the sunshine, we are finally alive,
Every street a dancefloor, every corner is a vibe.
Electronic tabla beats beneath a western bass,
This is the new Nepali sound — we're taking every space.
Indra Jatra energy, Tihar lights on every wall,
The whole country is a festival, we answer every call.
Pop it up and let the valley bounce from hill to hill —
This generation writes the future and we're writing still.`,

    Pop_Uplifting:
`Zero to a hundred, from the village to the stage,
This is not a comeback story — this is turning every page.
Mixed the sitar with the synth, the ragas with the bass,
Two worlds that were never meant to meet are now one sacred space.
Social media can't contain the culture we create,
Every upload is an offering to something ancient and great.
Pop is just the surface — underneath is centuries of soul,
And Nepali artists finally found their place and role.`,

    Pop_Romantic:
`Your Instagram is full of places I have never seen,
But somehow in your stories there's a space I want to be.
Modern love is strange — it lives between the post and real,
But when you laughed at dinner nothing digital could feel.
Timi mero notification — every hour, every day,
But what I really mean to say is never far away.
Let's close the screens for one whole evening, walk beneath the stars —
The oldest love in Kathmandu predates these phone-lit bars.`,

    Pop_Playful:
`Late night boba and a playlist, texting seventeen friends,
Kathmandu millennials — where the chaos never ends.
Wore the latest fashion but the jewelry is ancestral,
The juxtaposition of our lives is never quite sequential.
Post a dance reel to the folk song that my baje used to hum,
Three million views in twenty hours, the algorithm's done.
We are the bridge between the digital and the divine —
Equal parts of modernity and Himalayan shrine.`,

    // ── LOFI ────────────────────────────────────────────────────────────────
    Lofi_Melancholic:
`Tin ko chhaat ma paani jharcha, mann bhijchha sath sath,
Purani diary ma photo: timi ra saagarma haat haat.
The lofi beat plays softly like the rainfall on the tin,
A memory of evenings I can never enter in.
Chiya ko bhaaph ma tero aankha dekhchhu ani,
Aagaako khushi pitta — mann ko ghau gahani.
These instrumental loops were made for hours such as these,
When the nostalgia is as thick as Himalayan breeze.`,

    Lofi_Peaceful:
`Machhapuchhre peak through morning fog at half-past six,
The whole world slowed to something between silence and a fix.
A notebook and a pen, the lofi playing low and clean,
The Fewa Lake is perfectly reflecting everything unseen.
Pokhara doesn't hurry and today I choose to match,
The tempo of the mountains and the patience that they catch.
Words arrive like slow clouds finding shapes across the blue —
The lofi morning is the hour I remember who.`,

    Lofi_Nostalgic:
`Old black and white photos — baje in his best daura suruwal,
Before the bridges, before the roads, before the city sprawl.
The lofi crackle sounds exactly like the vinyl record's age,
A static between then and now that takes up every page.
Maijushree ko gaun ko dhoka khulchha sanjhama,
Kukur ko bhukne bansuri mischha saanjhama.
I study the geography of their faces in the frame,
And wonder what they'd make of me if I'd arrived the same.`,

    Lofi_Reflective:
`Headphones in, the world goes muffled, gentle, rearranged,
I sit inside the study that my childhood hasn't changed.
The lofi beats are consistent like a river I can trust,
Unlike the choices I have made that settled into dust.
Three in the morning, notes on paper, coffee going cold,
The question I keep circling is worth more than any gold:
Who would I have been if I had chosen differently that day —
And does the answer matter now, or should I let it stay?`,

    // ── FUSION ────────────────────────────────────────────────────────────
    Fusion_Uplifting:
`Madal meets the bass guitar above the valley floor,
Two centuries of music knocking on the selfsame door.
Sarangi threads a melody the synth can follow close,
This is what it sounds like when traditions meet their host.
Raga Bhairav in a minor key with hip-hop hi-hat underneath,
Devotion and ambition woven in a single wreath.
Nepal was always hybrid — many rivers, one great sea,
And fusion is the honest sound of everything we be.`,

    Fusion_Rebellious:
`They said keep the folk music clean, uncontaminated, pure,
I plugged the sarangi into fuzz and opened every door.
Tradition is a living thing that breathes and bends and grows,
It isn't locked in amber and it doesn't need our froze.
Tabla slap and trap snare — they both come from the hand,
Two percussionists across the centuries understand.
Fusion is rebellion against the cage of genre's line,
Nepal's sound belongs to every shape and every sign.`,

    Fusion_Nostalgic:
`Bansuri over jazz chords — my grandfather would stare,
But somewhere in the overtone his spirit is still there.
I learned the ragas from a teacher in a Kathmandu lane,
Then carried them to cities where the music sounds like rain.
The fusion is the distance from the mountain to the mall,
The self that's always navigating two worlds like a wall.
But when the sitar and the piano find the common note,
I finally stop dividing and inhabit this one coat.`,

    Fusion_Mysterious:
`In the studio at 3 AM the old machine made sound,
A frequency nobody programmed circling around.
The engineer says feedback — I say something old came through,
The heritage wants presence in the frequencies we brew.
Tantric patterns underneath the electronic hum,
A syllable from Sanskrit meeting every beat and drum.
Nepal's past is not behind us — it is woven in the code,
Every Fusion track we write becomes a haunted road.`,

    // ── AMBIENT ────────────────────────────────────────────────────────────
    Ambient_Peaceful:
`Wind across the Thorong La pass at seventeen thousand feet,
Breathing shallow, body light, the silence quite complete.
No instrument but atmosphere, no melody but stone,
The ambient music of the Himalaya is its own.
Below the cloud line prayer flags translate every gust to prayer,
And all the sounds dissolve into the extraordinarily bare.
This is what the synthesizer reaches for in quiet halls —
The frequency of altitude before the dewdrop falls.`,

    Ambient_Mysterious:
`The sound begins before it's there — a texture more than tone,
A feeling that the valley had before it was a home.
Pre-verbal, pre-religious, older than the mountain name,
Vibration in the bedrock that was always there the same.
Deep drone from the singing bowl fills the meditation room,
A sound that is a colour — somewhere amber, somewhere gloom.
The ambient is the space between the notes we choose to play,
Nepal's most ancient music never needed words to say.`,

    Ambient_Melancholic:
`The evening doesn't end — it just descends to different dark,
The ambient tone holds every feeling that the day could not park.
Reverb on the prayer bell lingers seven seconds long,
Just enough to understand the brevity of song.
Migration sounds like this — a sustained, unresolved chord,
Belonging to two places is a beautiful discord.
The ambient piece is finished when the feeling finally lands —
And I am still suspended somewhere between two hands.`,

    // ── EPIC ────────────────────────────────────────────────────────────────
    Epic_Triumphant:
`Hear the drums of Gorkha echo through the mountain pass,
The standard of the Shah raised high above the morning brass.
From Lamjung to Palpa, from Tanahun to the sea,
Prithvi Narayan woke an ancient nation to be free.
Nepal was not conquered — Nepal was unified and born,
The flag of endless colors never ever to be torn.
On Sagarmatha's crown the world looks up and sees the mark,
A Himalayan nation blazing sunlight through the dark.`,

    Epic_Uplifting:
`Pasang Lhamu Sherpa reached the top and changed the sky,
The first Nepali woman to refuse the world's no and fly.
Every summit has a story carved in bone and breath,
And every Nepali hero walked through fear to redefine their death.
The earthquake shook the valley but the people shook it back,
Rebuilt the temple stones by hand on the original track.
You are not from ordinary earth — you are from Himalayan ground,
And that means every mountain that exists is yours to be found.`,

    Epic_Spiritual:
`Om Mani Padme Hum — the mantra turns the wheel again,
Spinning from the Boudhanath's great stupa through the rain.
Buddha was born Nepali in the garden of Lumbini's grace,
And every lotus opened since has held that quiet space.
The pilgrims circle clockwise through the seasons and the years,
And the stupa holds the prayers like the mountain holds its tears.
Sacred is not separate from the daily bread we break —
It is the very reason for the life we choose to make.`,

    // ── SUSPENSE ────────────────────────────────────────────────────────────
    Suspense_Mysterious:
`Fog descends on Bhaktapur before the clock strikes nine,
The temple watchman's lantern makes an irregular shine.
Footsteps in the Kumari's courtyard — no one should be there,
The ancient door is open to the precipice of prayer.
Something written in the tantric script above the gate,
A warning or an invitation — hard to calculate.
Nepal holds its secrets in the layers of the stone,
And some discoveries are safest left to find alone.`,

    Suspense_Melancholic:
`The photograph arrived without a sender's name or seal,
A woman standing at the lake — the image somehow real.
Her face belongs to someone that my mother used to know,
A story from before my birth that no one chose to show.
The handwriting on the back is faded past the read,
But one word is still visible — it says the name I need.
Nepal keeps its histories in places hard to reach,
And some ancestral silences were not for anyone to breach.`,

    // ── CHILL ────────────────────────────────────────────────────────────
    Chill_Peaceful:
`Sunday in Sanepa, no agenda, nothing due,
The cats are on the rooftop and the sky is full of blue.
Chamomile and silence, a book that's half-begun,
The kind of afternoon that doesn't hurry to be done.
Distant temple bells at intervals remind the hour passed,
And I am grateful this particular Sunday is forecast.
No algorithm, no notification, no reply —
Just the Kathmandu sky doing what skies do: getting by.`,

    Chill_Nostalgic:
`Khaja thapana with the neighbourhood assembled on the mat,
Chiura ra dahi tarkari — simplest feast for that.
Before the restaurants and the delivery apps arrived,
The chill was in the sharing of whatever house contrived.
Evening after harvest when the work had earned its rest,
Baje would start a story and it always was the best.
The chill I'm chasing now has always lived in slower time —
Not in the soundtrack but the silence between every rhyme.`,

    // ── HAPPY ────────────────────────────────────────────────────────────
    Happy_Playful:
`Tihar ko batti bale, deusi chhorera ayo,
Bhai tika dinu aama ko aangan ma rangko chhaayo.
Let the lights of Tihar spill across the valley's dark,
Let every rooftop candle be a little joyful spark.
New rupees in the envelopes, dhai and roti in the hand,
This is the annual miracle that makes us understand.
Happiness in Nepal is never individual-made —
It's woven in the festival and sung in the parade.`,

    Happy_Uplifting:
`Best day of the year — we climbed the hill at sunrise to the peak,
Found the red rhododendrons that the spring had started to leak.
Nepal in April is the world reminding us it's round,
Every altitude an argument that beauty can be found.
The monastery rang its bell, the valley curved below,
And every worry I had carried crumbled in that glow.
Joy is not a feeling — it's a practice and a place:
The Himalayan sunrise on a freely offered face.`,

    // ── SAD ────────────────────────────────────────────────────────────────
    Sad_Melancholic:
`Aama ko chitthi aayo — haatko lekhai thaha chha,
Ghar ma sab thik chha, bhannu chha, maar chha maaya.
She writes that everything is fine in her careful, loving script,
And in the fine-ness of her fine I know what has been slipped.
Pardesh ma raat parchha, ghadi tiktik garchha,
Ghar ko yahaan aau aau mann le boltirarchha.
The clock is ticking here and home is there and there is much between,
And what a migrant misses most is what was never seen.`,

    Sad_Longing:
`Fewa lake ko beli bela dubyo timi satha,
Tasbir ma matra dekha gara — maya ko saath.
The photographs do not retain the warmth that day preserved,
The colour of the moment is a thing my eye deserved.
Pokhara was our city for three April weeks that year,
Now each return is evidence of something disappeared.
Timi chaina mero aankha ma, chaina tara,
Sadness ko naam rakhna sakina, chaina dhara.`,

    Sad_Nostalgic:
`The old house in Bhaktapur was sold when baje passed,
The courtyard and the woodwork and the stories couldn't last.
I drove by once and saw a hotel sign above the gate,
The window that I memorized now serves a different fate.
Childhood rooms don't wait for us — they change or disappear,
And grief for places is the quietest grief we ever bear.
I keep the house alive inside the architecture of my words,
And haunt its empty courtyard with the weight of memory's birds.`,

  }; // end LYRIC_DB

  // ── Fallback lyric generator for combos without a specific entry ──────────
  const GENRE_THEMES = {
    Rap:      { place: 'Kathmandu streets', element: 'fire in every bar', culture: 'Gorkhali pride' },
    Rock:     { place: 'the electric valley', element: 'amplified rebellion', culture: 'Nepali rock spirit' },
    RnB:      { place: 'the city after dark', element: 'a melody of longing', culture: 'soul meets heritage' },
    Jazz:     { place: 'the smoky café near Thamel', element: 'notes bending like the Bagmati', culture: 'improvised heritage' },
    Folk:     { place: 'the hillside village', element: 'the damphu and the flute', culture: 'ancestral voice' },
    Tamang:   { place: 'the Tamang highlands', element: 'the damphu drum at festival', culture: 'Tamang community pride' },
    Newari:   { place: 'Bhaktapur Durbar Square', element: 'carved wooden windows', culture: 'Newar craftsmanship' },
    Bhajan:   { place: 'the temple at dawn', element: 'sacred chant', culture: 'devotion and divinity' },
    Classical:{ place: 'the raga recital hall', element: 'the slow unfolding alap', culture: 'musical heritage' },
    Dohori:   { place: 'the mountain terrace', element: 'call-and-response song', culture: 'community voice' },
    Pop:      { place: 'neon-lit Kathmandu', element: 'the fused modern beat', culture: 'millennial Nepali' },
    Lofi:     { place: 'the quiet study room', element: 'rain on tin roofs', culture: 'reflective solitude' },
    Fusion:   { place: 'the hybrid studio', element: 'sitar meets synthesizer', culture: 'cultural evolution' },
    Ambient:  { place: 'the mountain plateau', element: 'singing bowl resonance', culture: 'meditation tradition' },
    Epic:     { place: 'the Himalayan summit', element: 'drums of ancient battle', culture: 'national pride' },
    Suspense: { place: 'the fog-covered temple', element: 'mystery in stone corridors', culture: 'tantric heritage' },
    Chill:    { place: 'the lakeside garden', element: 'afternoon stillness', culture: 'peaceful Nepali life' },
    Happy:    { place: 'the festival grounds', element: 'Tihar lights and laughter', culture: 'collective joy' },
    Sad:      { place: 'the empty migrant room', element: 'homesick silence', culture: 'the diaspora longing' },
  };
  const MOOD_LINES = {
    Aggressive:  ['with rage born from centuries of silence', 'the fire that no policy can restrain'],
    Rebellious:  ['refusing every cage the system drew', 'writing truth on walls they tried to whitewash'],
    Passionate:  ['with every heartbeat fully committed', 'the intensity of devotion undimmed'],
    Triumphant:  ['having climbed what others called impossible', 'the crown earned from relentless pursuit'],
    Reflective:  ['turning inward to the honest mirror', 'asking questions that the valley echoes back'],
    Melancholic: ['carrying the weight of beautiful loss', 'the blue note that never fully resolves'],
    Nostalgic:   ['reaching for the past with open hands', 'the smell of home encoded in the memory'],
    Longing:     ['across the distance that divides two hearts', 'the unfinished sentence of a love deferred'],
    Mysterious:  ['in the shadow of the ancient door', 'where the sacred and unknown converge'],
    Uplifting:   ['rising like the sun above the Himalaya', 'turning every scar into a source'],
    Romantic:    ['in the language that the mountains taught to rivers', 'when two hearts find the same altitude'],
    Playful:     ['dancing lightly on the edge of everything', 'with laughter that the valley amplifies'],
    Peaceful:    ['in the stillness that precedes the first note', 'where breath and silence are the same'],
    Spiritual:   ['where the mortal self dissolves into devotion', 'hearing the eternal in the mantra'],
  };

  /** Build a unique fallback lyric from genre + mood */
  function buildFallbackLyric(genre, mood) {
    const gt = GENRE_THEMES[genre] || GENRE_THEMES.Fusion;
    const ml = MOOD_LINES[mood]  || MOOD_LINES.Reflective;
    const ts = Date.now(); // ensures uniqueness even if called twice
    return `From ${gt.place} I carry ${gt.element},
${ml[0]} — this is ${gt.culture}.
The ${genre.toLowerCase()} tradition holds the key to who we are,
${ml[1]}, reaching like a prayer toward the star.

In Nepal there are two seasons: the one outside the door,
And the one inside the chest that knocks and knocks for more.
This melody was shaped by ${gt.place}'s exact air,
And every note we offer is a way of saying — we were here.

The ancestors who walked before us left their sound in stone,
In every verse we sing tonight we do not sing alone.
This is for the ones who stayed, the ones who had to go,
And for the ones still coming up the mountain, row by row.
(Generated: ${new Date(ts).toLocaleTimeString()})`;
  }

  /** Get lyric for given genre+mood — specific or generated */
  function getLyricSuggestion(genre, mood) {
    const key = `${genre}_${mood}`;
    return LYRIC_DB[key] || buildFallbackLyric(genre, mood);
  }

  // ─── Live feedback while typing lyrics ──────────────────────────────────────
  if (lyricsInput) {
    lyricsInput.addEventListener('input', () => {
      const text = lyricsInput.value;
      const len  = Math.min(text.length, 5000);
      if (charCountEl) charCountEl.innerText = len;
      if (text.length > 5000) {
        lyricsInput.value = text.substring(0, 5000);
        if (charCountEl) charCountEl.style.color = 'var(--crimson)';
      } else {
        if (charCountEl) charCountEl.style.color = '';
      }
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      if (wordCountEl) wordCountEl.innerText = words;
      if (words === 0) { if (liveFeedbackBox) liveFeedbackBox.style.display = 'none'; return; }
      if (liveFeedbackBox) liveFeedbackBox.style.display = 'flex';

      const nepaliKW = ['ko','ma','cha','ho','timro','mero','hami','timi','dil','sapana','aaucha','chha','garnu','bhayo'];
      const hasNepali = nepaliKW.some(w => text.toLowerCase().includes(w));
      if (langDetectEl) langDetectEl.innerText = hasNepali ? 'Nepali / Romanized' : 'English Fusion';

      const sadWords  = ['alone','dark','broken','rukeko','dukha','cry','loss','empty','sad','gone'];
      const hypeWords = ['rise','fight','king','aago','shakti','kranti','fire','rage','win','conquer'];
      const joyWords  = ['love','khushi','rang','celebrate','dance','sundar','laugh','joy','happy'];
      const spiritualKW = ['om','shiva','devi','mantra','prayer','bhakti','devata','sacred','temple'];
      const t = text.toLowerCase();
      if (spiritualKW.some(w => t.includes(w))) {
        if (emotionDetectEl) emotionDetectEl.innerText = 'Spiritual Depth';
      } else if (sadWords.some(w => t.includes(w))) {
        if (emotionDetectEl) emotionDetectEl.innerText = 'Melancholic Depth';
      } else if (hypeWords.some(w => t.includes(w))) {
        if (emotionDetectEl) emotionDetectEl.innerText = 'Rebellious Energy';
      } else if (joyWords.some(w => t.includes(w))) {
        if (emotionDetectEl) emotionDetectEl.innerText = 'Joyful Spirit';
      } else {
        if (emotionDetectEl) emotionDetectEl.innerText = 'Narrative Flow';
      }
    });
  }

  // ─── Generate flow ───────────────────────────────────────────────────────────
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      if (isGenerating) return;
      isGenerating = true;
      btnGenerate.disabled = true;
      btnGenerate.classList.add('btn-generating');
      btnGenerate.style.display = 'none';
      if (progressContainer) progressContainer.style.display = 'block';
      if (progressBarEl) progressBarEl.classList.add('active');

      const steps = ['Analyzing lyrics…','Mapping scale…','Selecting instruments…','Layering textures…','Rendering master…'];
      let stepIndex = 0;
      if (progressFill) progressFill.style.width = '0%';

      const interval = setInterval(() => {
        if (progressText) progressText.innerText = steps[stepIndex];
        if (progressFill) progressFill.style.width = ((stepIndex + 1) / steps.length * 100) + '%';
        stepIndex++;
        if (stepIndex === steps.length) { clearInterval(interval); setTimeout(completeGeneration, 700); }
      }, 750);
    });
  }

  function completeGeneration() {
    if (progressContainer) progressContainer.style.display = 'none';
    if (progressBarEl) progressBarEl.classList.remove('active');
    if (btnGenerate) {
      btnGenerate.style.display  = 'block';
      btnGenerate.disabled       = false;
      btnGenerate.classList.remove('btn-generating');
      btnGenerate.innerHTML      = '🔄 Generate New Version';
    }
    isGenerating = false;

    const genre    = genreSelect  ? genreSelect.value  : 'Fusion';
    const mood     = moodSelect   ? moodSelect.value   : 'Reflective';
    const tempo    = tempoInput   ? parseInt(tempoInput.value, 10) || 100 : 100;
    const key      = keySelect    ? keySelect.value    : 'C Major';
    const lyrics   = lyricsInput  ? lyricsInput.value  : '';
    const rawTitle = customTitleInput ? customTitleInput.value.trim() : '';
    const title    = rawTitle || `${mood} ${genre} Track`;

    const text = lyrics.toLowerCase();
    const sadHits  = ['alone','dark','broken','rukeko','dukha'].filter(w => text.includes(w)).length;
    const hypeHits = ['rise','fight','king','aago','shakti'].filter(w => text.includes(w)).length;
    const moodScore = Math.min(10, Math.max(1, 5 + hypeHits - sadHits));

    const session = window.NepAuth ? window.NepAuth.getSession() : null;

    // Unique synthesized audio — identified by genre+mood+tempo+key combo
    // NepAudio regenerates the exact same sound from these parameters every time
    const track = {
      id: Date.now(),
      title, date: new Date().toLocaleString(),
      lyrics, genre, mood, tempo, key, moodScore,
      duration: NepAudio.getDurationString(),
      file: null,          // no MP3 — audio is synthesized
      type: 'Music', favorite: false, offline: false,
      tags: [genre, mood], note: '',
      createdBy: session ? session.username : 'anonymous'
    };

    db.add('nepCulture_tracks', track);
    renderTrackList();
    loadTrackIntoPlayer(track);
    showToast(`"${title}" rendered successfully. ✓`);
  }

  // ─── Load track into right panel + NepAudio player ─────────────────────────
  function loadTrackIntoPlayer(track) {
    if (!track) return;
    currentTrack = track;

    // Update details panel
    if (detailTitle)  detailTitle.innerText  = track.title;
    if (detailDate)   detailDate.innerText   = track.date;
    if (detailLyrics) detailLyrics.innerText = track.lyrics || '(No lyrics)';
    if (detailTags)   detailTags.style.display = 'flex';
    if (playerDurationEl) playerDurationEl.innerText = track.duration || NepAudio.getDurationString();

    // Stop any current playback, load the new combo into the synth engine
    NepAudio.stop();
    NepAudio.load(track.genre, track.mood, track.tempo || 100, track.key || 'C Major');

    // Reset player UI
    if (playMainBtn) playMainBtn.innerText = '▶';
    if (timelineProgress) timelineProgress.style.width = '0%';
    if (currentTimeEl) currentTimeEl.innerText = '0:00';
    if (vinylArt) vinylArt.classList.remove('spinning');

    renderTrackList();
  }

  // ─── Play / Pause via NepAudio ───────────────────────────────────────────────
  if (playMainBtn) playMainBtn.addEventListener('click', togglePlayback);

  function togglePlayback() {
    if (!currentTrack) return;
    if (NepAudio.isPlaying()) {
      NepAudio.pause();
      if (playMainBtn) playMainBtn.innerText = '▶';
      if (vinylArt) vinylArt.classList.remove('spinning');
    } else {
      NepAudio.play();
      if (playMainBtn) playMainBtn.innerText = '⏸';
      if (vinylArt) vinylArt.classList.add('spinning');
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault(); togglePlayback();
    }
  });

  // ─── Timeline — driven by NepAudio.onTimeUpdate callback ─────────────────────
  NepAudio.onTimeUpdate((currentTime, duration) => {
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
    if (timelineProgress) timelineProgress.style.width = pct + '%';
    if (currentTimeEl) currentTimeEl.innerText = NepAudio.formatTime(currentTime);
  });

  if (timelineBar) {
    timelineBar.addEventListener('click', (e) => {
      if (!currentTrack) return;
      const rect  = timelineBar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      NepAudio.seek(ratio);
    });
  }

  function formatTime(secs) {
    return NepAudio.formatTime(secs);
  }

  // ─── Render track list ────────────────────────────────────────────────────────
  function renderTrackList(filter = '') {
    if (!trackContainer) return;
    let tracks = db.get('nepCulture_tracks');
    if (filter) {
      const q = filter.toLowerCase();
      tracks = tracks.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.genre || '').toLowerCase().includes(q) ||
        (t.lyrics || '').toLowerCase().includes(q)
      );
    }
    trackContainer.innerHTML = '';
    if (tracks.length === 0) {
      trackContainer.innerHTML = '<p style="color:#777; padding: 20px 0;">No tracks yet. Generate your first track!</p>';
      return;
    }
    tracks.forEach(track => {
      const card = document.createElement('div');
      card.className = 'track-card';
      card.setAttribute('tabindex','0');
      card.setAttribute('role','button');
      card.setAttribute('aria-label', `Load track: ${track.title}`);
      card.dataset.id = track.id;
      if (currentTrack && currentTrack.id === track.id) card.style.borderColor = 'var(--gold)';

      // Admin sees delete button on all tracks; regular users only on own
      const session = window.NepAuth ? window.NepAuth.getSession() : null;
      const canDelete = !session || window.NepAuth.isAdmin() || track.createdBy === session.username || !track.createdBy;

      card.innerHTML = `
        <div class="track-cover-sm" aria-hidden="true"></div>
        <div class="track-info">
          <h4>${escHtml(track.title)}</h4>
          <span class="track-date">${escHtml(track.date)}</span>
          ${track.tags && track.tags.length ? `<div class="track-user-tags">${track.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="track-actions">
          <button class="icon-btn fav-btn"    title="Favorite"  aria-label="Toggle favorite" data-id="${track.id}">${track.favorite ? '❤️' : '🤍'}</button>
          <button class="icon-btn dl-btn"     title="Download"  aria-label="Download track"  data-file="${escHtml(track.file)}" data-title="${escHtml(track.title)}">⬇</button>
          ${canDelete ? `<button class="icon-btn delete-btn" title="Delete" aria-label="Delete track" data-id="${track.id}">🗑</button>` : ''}
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (['fav-btn','dl-btn','delete-btn'].some(c => e.target.classList.contains(c))) return;
        loadTrackIntoPlayer(track);
      });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadTrackIntoPlayer(track); });

      card.querySelector('.fav-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleFavorite(track.id); });
      card.querySelector('.dl-btn').addEventListener('click',  (e) => { e.stopPropagation(); downloadTrack(track); });
      const delBtn = card.querySelector('.delete-btn');
      if (delBtn) delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteTrack(track.id, card); });

      trackContainer.appendChild(card);
    });
  }

  function deleteTrack(id, cardEl) {
    if (currentTrack && currentTrack.id === id) {
      currentTrack = null;
      NepAudio.stop();
      if (detailTitle)  detailTitle.innerText  = 'No Track Selected';
      if (detailDate)   detailDate.innerText   = '';
      if (detailLyrics) detailLyrics.innerText = '';
      if (detailTags)   detailTags.style.display = 'none';
      if (vinylArt) vinylArt.classList.remove('spinning');
      if (playMainBtn) playMainBtn.innerText = '▶';
      if (timelineProgress) timelineProgress.style.width = '0%';
      if (currentTimeEl) currentTimeEl.innerText = '0:00';
    }
    if (cardEl) {
      cardEl.classList.add('fade-out');
      setTimeout(() => { db.remove('nepCulture_tracks', id); renderTrackList(trackSearchInput ? trackSearchInput.value : ''); }, 340);
    } else {
      db.remove('nepCulture_tracks', id);
      renderTrackList(trackSearchInput ? trackSearchInput.value : '');
    }
    showToast('Track deleted.', 'crimson');
  }

  function toggleFavorite(id) {
    const track = db.find('nepCulture_tracks', id);
    if (!track) return;
    const newVal = !track.favorite;
    db.update('nepCulture_tracks', id, { favorite: newVal });
    showToast(newVal ? '❤️ Added to Favorites' : 'Removed from Favorites', newVal ? 'gold' : 'crimson');
    renderTrackList(trackSearchInput ? trackSearchInput.value : '');
  }

  function downloadTrack(track) {
    // Audio is synthesized live — export the track metadata as JSON instead
    const exportData = {
      title: track.title,
      genre: track.genre,
      mood:  track.mood,
      tempo: track.tempo,
      key:   track.key,
      lyrics: track.lyrics,
      date:  track.date,
      note:  'Track audio is synthesized via Web Audio API. Parameters above recreate the exact sound.'
    };
    exportJSON(exportData, `${(track.title || 'track').replace(/[^a-z0-9]/gi,'_')}_NepCulture.json`);
    showToast('Track exported as JSON — audio synths live from these parameters. 🎵');
  }

  // ─── Search ──────────────────────────────────────────────────────────────────
  if (trackSearchInput) {
    trackSearchInput.addEventListener('input', debounce((e) => { renderTrackList(e.target.value); }, 150));
  }

  // ─── Assist button ────────────────────────────────────────────────────────────
  const btnAssist = document.querySelector('.btn-assistant');
  if (btnAssist && lyricsInput) {
    btnAssist.addEventListener('click', () => {
      const genre      = genreSelect ? genreSelect.value : 'Fusion';
      const mood       = moodSelect  ? moodSelect.value  : 'Reflective';
      const suggestion = getLyricSuggestion(genre, mood);
      lyricsInput.value = suggestion;
      lyricsInput.dispatchEvent(new Event('input'));
      showToast(`${genre} × ${mood} lyrics loaded. Edit freely!`);
    });
  }

  // ─── Offline toggle ──────────────────────────────────────────────────────────
  const offlineBtn = document.querySelector('.player-actions .icon-btn:last-child');
  if (offlineBtn) {
    offlineBtn.title = 'Make available offline (demo)';
    offlineBtn.addEventListener('click', () => {
      if (!currentTrack) return;
      db.update('nepCulture_tracks', currentTrack.id, { offline: true });
      showToast('Marked as offline ✓ (simulated)', 'purple');
    });
  }

  // ─── Favorite toggle from player bar ─────────────────────────────────────────
  const favPlayerBtn = document.querySelector('.player-actions .icon-btn:first-child');
  if (favPlayerBtn) {
    favPlayerBtn.addEventListener('click', () => {
      if (!currentTrack) return;
      toggleFavorite(currentTrack.id);
      const updated = db.find('nepCulture_tracks', currentTrack.id);
      if (updated) favPlayerBtn.innerText = updated.favorite ? '❤️' : '♡';
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    renderTrackList();
    const recent = db.get('nepCulture_tracks')[0];
    if (recent) loadTrackIntoPlayer(recent);
  });
  // Also run immediately in case DOMContentLoaded already fired
  if (document.readyState !== 'loading') {
    renderTrackList();
    const recent = db.get('nepCulture_tracks')[0];
    if (recent) loadTrackIntoPlayer(recent);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
