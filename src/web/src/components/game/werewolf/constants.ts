import playerImg from '@/public/image/player.jpg';
import imgVillager        from '@/public/image/werewolf/villager.jpg';
import imgWerewolf        from '@/public/image/werewolf/werewolf.jpg';
import imgSeer            from '@/public/image/werewolf/seeder.jpg';
import imgGuard          from '@/public/image/werewolf/guardian.jpg';
import imgSheriff         from '@/public/image/werewolf/sheriff.jpg';
import imgSuicidal          from '@/public/image/werewolf/misanthropist.jpg';
import imgHunter          from '@/public/image/werewolf/hunter.jpg';
import imgWitch           from '@/public/image/werewolf/witch.jpg';
import imgCupid           from '@/public/image/werewolf/cupid.jpg';
import imgLittleGirl      from '@/public/image/werewolf/smallgirl.jpg';
import imgTwoSisters      from '@/public/image/werewolf/twosisters.jpg';
import imgThreeBrothers   from '@/public/image/werewolf/threebrothers.jpg';
import imgStutteringJudge from '@/public/image/werewolf/judge.jpg';
import imgRustyKnight     from '@/public/image/werewolf/knight.jpg';
import imgDevotedServant  from '@/public/image/werewolf/humble.jpg';
import imgWildChild       from '@/public/image/werewolf/wildchild.jpg';
import imgFool           from '@/public/image/werewolf/goofyyoungman.jpg';
import imgDrunk           from '@/public/image/werewolf/drunkard.jpg';
import imgWolfCub         from '@/public/image/werewolf/werewolfcub.jpg';
import imgDogWolf         from '@/public/image/werewolf/hybridwolf.jpg';
import imgBigBadWolf      from '@/public/image/werewolf/hulkingwerewolf.jpg';
import imgWolfFather      from '@/public/image/werewolf/werewolffigure.jpg';
import imgHiddenWolf      from '@/public/image/werewolf/wolfhides.jpg';
import imgWolfSorcerer    from '@/public/image/werewolf/werewolfsorcerer.jpg';
import imgThief           from '@/public/image/werewolf/thief.jpg';
import imgCursed          from '@/public/image/werewolf/tormentedvillager.jpg';
import imgAvenger         from '@/public/image/werewolf/vengeful.jpg';
import imgImpersonator           from '@/public/image/werewolf/impostor.jpg';
import imgWhiteWolf       from '@/public/image/werewolf/whitewolf.jpg';
import imgAngel           from '@/public/image/werewolf/angelic.jpg';
import imgElder           from '@/public/image/werewolf/villageelder.jpg';

export { playerImg };

export const ROLE_IMAGES: Record<string, string> = {
  villager:        imgVillager,
  werewolf:        imgWerewolf,
  seer:            imgSeer,
  guard:          imgGuard,
  sheriff:         imgSheriff,
  jester:          imgSuicidal,
  hunter:          imgHunter,
  witch:           imgWitch,
  cupid:           imgCupid,
  little_girl:     imgLittleGirl,
  two_sisters:     imgTwoSisters,
  three_brothers:  imgThreeBrothers,
  stuttering_judge: imgStutteringJudge,
  rusty_knight:    imgRustyKnight,
  devoted_servant: imgDevotedServant,
  wild_child:      imgWildChild,
  idiot:           imgFool,
  drunk:           imgDrunk,
  wolf_cub:        imgWolfCub,
  dog_wolf:        imgDogWolf,
  big_bad_wolf:    imgBigBadWolf,
  wolf_father:     imgWolfFather,
  hidden_wolf:     imgHiddenWolf,
  wolf_sorcerer:   imgWolfSorcerer,
  thief:           imgThief,
  cursed:          imgCursed,
  avenger:         imgAvenger,
  actor:           imgImpersonator,
  white_wolf:      imgWhiteWolf,
  angel:           imgAngel,
  elder:           imgElder,
};

export const ROLE_CARD_STYLES: Record<string, string> = {
  // Village
  villager:         'bg-green-950  border-green-800',
  seer:             'bg-purple-950 border-purple-700',
  guard:           'bg-blue-950   border-blue-700',
  sheriff:          'bg-yellow-950 border-yellow-700',
  hunter:           'bg-lime-950   border-lime-700',
  witch:            'bg-teal-950   border-teal-700',
  cupid:            'bg-pink-950   border-pink-600',
  little_girl:      'bg-rose-950   border-rose-700',
  two_sisters:      'bg-green-950  border-green-700',
  three_brothers:   'bg-green-950  border-green-700',
  stuttering_judge: 'bg-amber-950  border-amber-700',
  rusty_knight:     'bg-slate-950  border-slate-600',
  devoted_servant:  'bg-green-950  border-green-600',
  wild_child:       'bg-emerald-950 border-emerald-700',
  idiot:            'bg-green-950  border-green-500',
  drunk:            'bg-green-950  border-green-500',
  // Werewolf
  werewolf:         'bg-red-950    border-red-800',
  wolf_cub:         'bg-red-950    border-red-700',
  dog_wolf:         'bg-orange-950 border-orange-700',
  big_bad_wolf:     'bg-red-950    border-red-500',
  wolf_father:      'bg-red-950    border-red-400',
  hidden_wolf:      'bg-red-950    border-red-900',
  wolf_sorcerer:    'bg-fuchsia-950 border-fuchsia-700',
  // Third party
  thief:            'bg-gray-900   border-gray-600',
  cursed:           'bg-violet-950 border-violet-700',
  avenger:          'bg-gray-950   border-gray-500',
  actor:            'bg-gray-950   border-gray-400',
  // Neutral
  jester:           'bg-pink-950   border-pink-700',
  white_wolf:       'bg-zinc-900   border-zinc-500',
  angel:            'bg-sky-950    border-sky-600',
  elder:            'bg-brown-950  border-yellow-800',
};

export const ROLE_ICONS: Record<string, string> = {
  // Village
  villager:         '🏘',
  seer:             '🔮',
  guard:           '💊',
  sheriff:          '🔰',
  hunter:           '🏹',
  witch:            '🧙',
  cupid:            '💘',
  little_girl:      '👧',
  two_sisters:      '👭',
  three_brothers:   '👬',
  stuttering_judge: '⚖️',
  rusty_knight:     '🗡️',
  devoted_servant:  '🫡',
  wild_child:       '🌿',
  idiot:            '🤪',
  drunk:            '🍺',
  // Werewolf
  werewolf:         '🐺',
  wolf_cub:         '🐶',
  dog_wolf:         '🐕',
  big_bad_wolf:     '😈',
  wolf_father:      '🦴',
  hidden_wolf:      '🥷',
  wolf_sorcerer:    '🔮',
  // Third party
  thief:            '🦝',
  cursed:           '💀',
  avenger:          '⚔️',
  actor:            '🎭',
  // Neutral
  jester:           '🃏',
  white_wolf:       '🤍',
  angel:            '😇',
  elder:            '🧓',
};
