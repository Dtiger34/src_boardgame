import { WolfChatBox } from '@/components/game/werewolf/WolfChatBox';

interface WolfChatWrapperProps {
  roomId: string;
  phase: 'night' | 'day_discussion' | 'day_vote';
  isWolf: boolean;
}

export function WolfChatWrapper({ roomId, phase, isWolf }: WolfChatWrapperProps) {
  if (phase !== 'night' || !isWolf) return null;
  return <WolfChatBox roomId={roomId} />;
}
