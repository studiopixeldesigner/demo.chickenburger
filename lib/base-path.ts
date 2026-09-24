// next/image n'ajoute pas le basePath aux images de /public : il faut le préfixer soi-même
export const withBasePath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${path}`;
