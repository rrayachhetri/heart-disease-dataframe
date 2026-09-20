import styles from './HistoryPage.module.less';

export default function ModalSection({
  icon,
  title,
  children,
  sectionId,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  sectionId?: string;
}) {
  const resolvedSectionId = sectionId ?? undefined;
  return (
    <section className={styles.modalSection} id={resolvedSectionId}>
      <div className={styles.modalSectionHeader}>
        <span className={styles.modalSectionHeaderLeft}>
          {icon}
          <h4 className={styles.modalSectionTitle}>{title}</h4>
        </span>
      </div>
      <div className={styles.modalSectionBody}>{children}</div>
    </section>
  );
}
