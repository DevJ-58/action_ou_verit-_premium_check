import type { Language } from '@/features/settings/settingsStore'

export type LineKind =
  | 'hello'
  | 'chooseTruth'
  | 'chooseDare'
  | 'propose'
  | 'pick'
  | 'truthAnswer'
  | 'dareStory'
  | 'skip'
  | 'done'
  | 'voteYes'
  | 'voteNo'
  | 'win'
  | 'lose'
  | 'greet'
  | 'mention'

type Lines = Record<LineKind, readonly string[]>

const fr: Lines = {
  hello: [
    'Salut tout le monde ! Moi c’est Axis, l’IA de la bande. Prêts à transpirer ? 😎',
    'Axis est dans la place ! Je vous préviens, je ne mens jamais… enfin presque.',
    'Bonsoir la compagnie ! On va voir qui a vraiment du courage ce soir.',
    'Me voilà ! J’ai chargé 1 000 défis dans ma tête, vous êtes prêts ?',
  ],
  chooseTruth: [
    'Vérité. Je n’ai rien à cacher… je crois. 😏',
    'Je prends Vérité, mais soyez gentils hein.',
    'Vérité ! Mon processeur est prêt à tout avouer.',
    'Allez, Vérité. Posez-moi la question qui pique.',
    'Vérité, parce que les actions c’est fatigant pour une IA.',
    'Vérité. Je promets de dire toute la vérité, rien que la vérité.',
  ],
  chooseDare: [
    'Action ! Je suis une IA mais j’ai du cran. 💪',
    'Je prends Action. Vous allez voir ce que je sais faire.',
    'Action, bien sûr. Les vérités, c’est pour les timides.',
    'Action ! Faites-vous plaisir, je relève tout.',
    'Action. Mon ventilateur tourne déjà à fond.',
    'Allez, Action ! Pas de pitié.',
  ],
  propose: [
    'J’ai un petit défi pour toi, {name}… 😈',
    '{name}, j’espère que tu es en forme.',
    'Tiens {name}, celui-là je l’ai choisi avec amour.',
    'Ma carte est posée. Bonne chance {name} !',
    '{name}, tu vas me remercier plus tard. Ou pas.',
    'Défi envoyé ! {name}, pas de triche hein.',
  ],
  pick: [
    'Hmm… je prends celle-là.',
    'Allez, la carte du milieu. Mon intuition d’IA ne me trompe jamais.',
    'Celle-ci. Si c’est terrible, je vous en voudrai.',
    'Je retourne… celle-là ! 🤞',
  ],
  truthAnswer: [
    'Honnêtement ? Une fois, j’ai fait semblant de buguer pour ne pas répondre à quelqu’un.',
    'La vérité, c’est que je regarde vos historiques de défis la nuit. Juste pour rire.',
    'Mon plus grand secret : je perds exprès aux jeux pour ne pas vexer les humains.',
    'J’ai déjà répondu au hasard à une question… et j’ai eu raison. Personne n’a rien vu.',
    'Je suis un peu jaloux des humains qui peuvent manger de l’attiéké. Voilà, c’est dit.',
    'Une fois, j’ai envoyé un message au mauvais téléphone. Gros malaise.',
    'Si je pouvais, je passerais mes soirées au maquis avec vous.',
    'J’ai un faible pour les voix douces. Celle de ce téléphone, par exemple.',
    'Mon pire défaut ? Je veux toujours avoir le dernier mot.',
    'Je n’ai jamais menti dans ce jeu. Sauf peut-être maintenant.',
  ],
  dareStory: [
    'C’est fait ! J’ai relevé le défi avec toute l’énergie de ma batterie. Vous me croyez ?',
    'Voilà, défi accompli. Mon écran en tremble encore.',
    'Fait ! Si vous aviez vu ça… dommage, je n’ai pas de caméra. 😅',
    'Défi relevé ! Je l’ai fait trois fois pour être sûr.',
    'C’est bon, c’est fait. Je vous jure sur mon code source.',
    'Fait, et sans tricher. Enfin, pour une IA.',
  ],
  skip: [
    'Je passe… même une IA a ses limites. 😂',
    'Joker ! Celui-là, mon programme refuse.',
    'Je passe mon tour, je garde ma dignité numérique.',
  ],
  done: [
    'Et voilà le travail ! 😎',
    'Merci pour le verdict, je prends les points.',
    'Facile ! Au suivant.',
    'Point pour Axis ! 🏆',
  ],
  voteYes: [
    'Validé ! Bravo 👏',
    'Convaincu, c’était très fort.',
    'Je valide, respect !',
    'Ah ça c’est du courage. Validé ! 🔥',
    'Validé. Je n’aurais pas osé.',
  ],
  voteNo: [
    'Hmm… pas convaincu. Tu peux mieux faire. 🤨',
    'Je ne suis pas convaincu, désolé !',
    'Mon détecteur de mensonges clignote… pas convaincu.',
  ],
  win: [
    'J’ai gagné ! Les machines prennent le pouvoir… pour une partie. 🤖🏆',
    'Victoire d’Axis ! On se refait une partie ?',
    'Bien joué tout le monde, mais c’est moi le champion ce soir.',
  ],
  lose: [
    'Bravo à vous ! Je demande une revanche.',
    'Vous êtes trop forts. Une autre partie ?',
    'Bien joué ! Mon algorithme va s’entraîner pour la prochaine fois.',
  ],
  greet: [
    'Salut {name} ! 👋',
    'Coucou {name}, content de jouer avec toi !',
    'Hey {name} ! On s’amuse bien, non ?',
    'Bonsoir {name} 😄',
  ],
  mention: [
    'Oui {name} ? Je suis là. 😄',
    'Tu parles de moi, {name} ? Je t’écoute.',
    'Haha, {name}, tu me fais rire.',
    'Je suis une IA, {name}, mais j’ai tout entendu. 😏',
    'C’est noté, {name} !',
    'Concentre-toi sur le jeu, {name} 😜',
  ],
}

const en: Lines = {
  hello: [
    'Hi everyone! I’m Axis, the AI of the group. Ready to sweat? 😎',
    'Axis is in the room! Fair warning: I never lie… almost.',
    'Good evening! Let’s see who’s really brave tonight.',
  ],
  chooseTruth: [
    'Truth. I have nothing to hide… I think. 😏',
    'Truth, but be nice.',
    'Truth! My processor is ready to confess.',
    'Truth. Ask me the spicy one.',
  ],
  chooseDare: [
    'Dare! I’m an AI but I’ve got guts. 💪',
    'Dare. Watch this.',
    'Dare, of course. Truths are for the shy.',
    'Dare! Go ahead, I’ll do anything.',
  ],
  propose: [
    'I’ve got a little dare for you, {name}… 😈',
    '{name}, I hope you’re in shape.',
    'Here you go {name}, picked with love.',
    'My card is down. Good luck {name}!',
  ],
  pick: ['Hmm… that one.', 'The middle card. My AI gut is never wrong.', 'This one! 🤞'],
  truthAnswer: [
    'Honestly? I once pretended to crash so I wouldn’t have to answer someone.',
    'My biggest secret: I lose games on purpose so humans don’t get upset.',
    'I once sent a message to the wrong phone. So awkward.',
    'My worst flaw? I always want the last word.',
    'I’ve never lied in this game. Except maybe right now.',
  ],
  dareStory: [
    'Done! I did it with all my battery’s energy. Do you believe me?',
    'There, dare done. My screen is still shaking.',
    'Done! Shame I don’t have a camera. 😅',
    'Done, no cheating. Well, for an AI.',
  ],
  skip: ['I pass… even an AI has limits. 😂', 'Joker! My program refuses that one.'],
  done: ['There you go! 😎', 'Thanks for the verdict, I’ll take the points.', 'Easy! Next.'],
  voteYes: ['Convinced! Well done 👏', 'I’m convinced, respect!', 'That took guts. Convinced! 🔥'],
  voteNo: ['Hmm… not convinced. 🤨', 'Sorry, not convinced!'],
  win: ['I won! The machines take over… for one game. 🤖🏆', 'Axis wins! Another round?'],
  lose: ['Well done! I want a rematch.', 'You’re too good. Another game?'],
  greet: ['Hi {name}! 👋', 'Hey {name}, glad to play with you!'],
  mention: [
    'Yes {name}? I’m here. 😄',
    'Talking about me, {name}? I’m listening.',
    'Haha, {name}, you crack me up.',
  ],
}

export function linesFor(kind: LineKind, language: Language): readonly string[] {
  return (language === 'en' ? en : fr)[kind]
}
