'use server';

import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/app/actions/auth';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function toggleStockAction(id: string, inStock: boolean) {
  await verifyAuth();
  const { error } = await supabaseAdmin
    .from('products')
    .update({ inStock })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleOptionStockAction(id: string, inStock: boolean) {
  await verifyAuth();

  const { data: currentOption, error: fetchError } = await supabaseAdmin
    .from('options')
    .select('name')
    .eq('id', id)
    .single();

  if (fetchError || !currentOption) {
    throw new Error(fetchError?.message || "Option introuvable");
  }

  const { error: updateError } = await supabaseAdmin
    .from('options')
    .update({ inStock })
    .eq('name', currentOption.name);

  if (updateError) throw new Error(updateError.message);
}

export async function upsertProductAction(payload: any, id: string | null) {
  await verifyAuth();
  if (id) {
    const { error } = await supabaseAdmin.from('products').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from('products').insert([payload]);
    if (error) throw new Error(error.message);
  }
}

export async function deleteProductAction(id: string) {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function upsertOptionAction(payload: any, id: string | null) {
  await verifyAuth();
  if (id) {
    const { error } = await supabaseAdmin.from('options').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from('options').insert([payload]);
    if (error) throw new Error(error.message);
  }
}

export async function deleteOptionAction(id: string) {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('options').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function saveCategoryAction(payload: any, id: string | null) {
  await verifyAuth();
  if (id) {
    const { error } = await supabaseAdmin.from('categories').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from('categories').insert([payload]);
    if (error) throw new Error(error.message);
  }
}

export async function deleteCategoryAction(id: string) {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateCategoryPositionsAction(updates: { id: string; position: number }[]) {
  await verifyAuth();
  for (const item of updates) {
    const { error } = await supabaseAdmin
      .from('categories')
      .update({ position: item.position })
      .eq('id', item.id);
    if (error) throw new Error(error.message);
  }
}

export async function saveOptionTypeAction(payload: any, id: string | null) {
  await verifyAuth();
  if (id) {
    const { error } = await supabaseAdmin.from('option_types').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabaseAdmin.from('option_types').insert([payload]);
    if (error) throw new Error(error.message);
  }
}

export async function deleteOptionTypeAction(slug: string) {
  await verifyAuth();
  const { error } = await supabaseAdmin.from('option_types').delete().eq('slug', slug);
  if (error) throw new Error(error.message);
}