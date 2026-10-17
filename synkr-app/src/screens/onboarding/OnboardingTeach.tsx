import React from 'react';
import SkillPicker from '../../components/SkillPicker';
import { useAuth } from '../../auth/AuthContext';
import { useNav } from '../../navigation/useNav';

export default function OnboardingTeach() {
  const nav = useNav();
  const { user, signOut } = useAuth();
  const editing = !!user?.onboardingCompleted;
  return (
    <SkillPicker
      mode="teach"
      step={1}
      title="O que podes ensinar?"
      subtitle="Escolhe pelo menos uma habilidade em que és intermédio ou avançado."
      initial={user?.teach.map((s) => ({ skillId: s.skillId, level: s.level }))}
      onNext={(teach) => nav.navigate('OnboardingLearn', { teach })}
      onBack={editing ? () => nav.goBack() : signOut}
      backLabel={editing ? 'Cancelar' : 'Terminar sessão'}
    />
  );
}
