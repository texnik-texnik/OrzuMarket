import React from 'react';
import { useTranslation } from '../localization/LanguageProvider';

export function StatusBadge({ status }) {
  const { t } = useTranslation();
  return <span className={`status status-${status}`}>{t('status_' + status)}</span>;
}
