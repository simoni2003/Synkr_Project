import React, { useState } from 'react';
import SkillPicker from '../../components/SkillPicker';
import { useAuth } from '../../auth/AuthContext';
import { apiError } from '../../services/api';
import { useNav, useParams } from '../../navigation/useNav';
import type { SkillSelection } from '../../types/api';

export default function OnboardingLearn() {
  const { teach } = useParams<'OnboardingLearn'>();
  const nav = useNav();
  const { user, saveSkills } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const editing = !!user?.onboardingCompleted;

  const save = async (learn: SkillSelection[]) => {
    setBusy(true);
    setError(null);
    try {
      await saveSkills(teach, learn);
      // Primeira vez: a navegação muda sozinha para a app. Ao editar: volta ao início.
      if (editing) nav.popToTop();
    } catch (e) {
      setError(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SkillPicker
      mode="learn"
      step={2}
      title="O que queres aprender?"
      subtitle="Escolhe pelo menos uma habilidade em que és iniciante ou intermédio."
      initial={user?.learn.map((s) => ({ skillId: s.skillId, level: s.level }))}
      exclude={teach.map((s) => s.skillId)}
      busy={busy}
      error={error}
      nextLabel={editing ? 'Guardar competências' : 'Concluir'}
      onNext={save}
      onBack={() => nav.goBack()}
    />
  );
}
