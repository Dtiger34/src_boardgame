import { useTranslation } from 'react-i18next';

export function useRoleLabel(): {
  roleLabel: Record<string, string>;
  roleDesc: Record<string, string>;
} {
  const { t } = useTranslation();

  const roleLabel: Record<string, string> = {
    villager:         t('werewolf.roleVillager'),
    werewolf:         t('werewolf.roleWerewolf'),
    seer:             t('werewolf.roleSeer'),
    guard:           t('werewolf.roleGuard'),
    sheriff:          t('werewolf.roleSheriff'),
    jester:           t('werewolf.roleSuicidal'),
    hunter:           t('werewolf.roleHunter'),
    witch:            t('werewolf.roleWitch'),
    cupid:            t('werewolf.roleCupid'),
    two_sisters:      t('werewolf.roleTwoSisters'),
    three_brothers:   t('werewolf.roleThreeBrothers'),
    stuttering_judge: t('werewolf.roleStutteringJudge'),
    rusty_knight:     t('werewolf.roleRustyKnight'),
    devoted_servant:  t('werewolf.roleDevotedServant'),
    wild_child:       t('werewolf.roleWildChild'),
    idiot:            t('werewolf.roleFool'),
    drunk:            t('werewolf.roleDrunk'),
    wolf_cub:         t('werewolf.roleWolfCub'),
    dog_wolf:         t('werewolf.roleDogWolf'),
    big_bad_wolf:     t('werewolf.roleBigBadWolf'),
    wolf_father:      t('werewolf.roleWolfFather'),
    hidden_wolf:      t('werewolf.roleHiddenWolf'),
    wolf_sorcerer:    t('werewolf.roleWolfSorcerer'),
    thief:            t('werewolf.roleThief'),
    cursed:           t('werewolf.roleCursed'),
    avenger:          t('werewolf.roleAvenger'),
    actor:            t('werewolf.roleImpersonator'),
    white_wolf:       t('werewolf.roleWhiteWolf'),
    angel:            t('werewolf.roleAngel'),
    elder:            t('werewolf.roleElder'),
  };

  const roleDesc: Record<string, string> = {
    villager:         t('werewolf.descVillager'),
    werewolf:         t('werewolf.descWerewolf'),
    seer:             t('werewolf.descSeer'),
    guard:           t('werewolf.descGuard'),
    sheriff:          t('werewolf.descSheriff'),
    jester:           t('werewolf.descSuicidal'),
    hunter:           t('werewolf.descHunter'),
    witch:            t('werewolf.descWitch'),
    cupid:            t('werewolf.descCupid'),
    two_sisters:      t('werewolf.descTwoSisters'),
    three_brothers:   t('werewolf.descThreeBrothers'),
    stuttering_judge: t('werewolf.descStutteringJudge'),
    rusty_knight:     t('werewolf.descRustyKnight'),
    devoted_servant:  t('werewolf.descDevotedServant'),
    wild_child:       t('werewolf.descWildChild'),
    idiot:            t('werewolf.descFool'),
    drunk:            t('werewolf.descDrunk'),
    wolf_cub:         t('werewolf.descWolfCub'),
    dog_wolf:         t('werewolf.descDogWolf'),
    big_bad_wolf:     t('werewolf.descBigBadWolf'),
    wolf_father:      t('werewolf.descWolfFather'),
    hidden_wolf:      t('werewolf.descHiddenWolf'),
    wolf_sorcerer:    t('werewolf.descWolfSorcerer'),
    thief:            t('werewolf.descThief'),
    cursed:           t('werewolf.descCursed'),
    avenger:          t('werewolf.descAvenger'),
    actor:            t('werewolf.descImpersonator'),
    white_wolf:       t('werewolf.descWhiteWolf'),
    angel:            t('werewolf.descAngel'),
    elder:            t('werewolf.descElder'),
  };

  return { roleLabel, roleDesc };
}
