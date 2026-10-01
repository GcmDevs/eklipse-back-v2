import slugify from 'slugify';

export type SlugExistsFn = (slug: string) => Promise<boolean>;

export async function generateSlug(
    text: string,
    sequence?: number,
): Promise<string> {
    const baseSlug = slugify(text, { lower: true, strict: true });
    return sequence ? `${baseSlug}-${sequence}` : baseSlug;
}

