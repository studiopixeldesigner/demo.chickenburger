// Préfixe les fichiers de /public quand le site est servi dans un sous-dossier (GitHub Pages).
export const withBasePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${path}`;
