import type { Theme } from '../types';
import { mockThemes } from '../data/mockData';

export async function fetchThemes(): Promise<Theme[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return [...mockThemes];
}

export async function fetchThemeById(id: string): Promise<Theme | null> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return mockThemes.find((t) => t.id === id) || null;
}
