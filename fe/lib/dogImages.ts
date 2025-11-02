export interface DogImageItem {
  label: string; // 표시용 라벨(파일명 기반)
  src: string;   // public 경로
}

export const DOG_IMAGES: DogImageItem[] = [
  { label: '골든리트리버', src: '/dog_image/골든리트리버.png' },
  { label: '달마시안', src: '/dog_image/달마시안.png' },
  { label: '도베르만', src: '/dog_image/도베르만.png' },
  { label: '라브라도', src: '/dog_image/라브라도.png' },
  { label: '러셀테리어', src: '/dog_image/러셀테리어.png' },
  { label: '미니어처핀처', src: '/dog_image/미니어처핀처.png' },
  { label: '보스턴테리어', src: '/dog_image/보스턴테리어.png' },
  { label: '불테리어', src: '/dog_image/불테리어.png' },
  { label: '비글', src: '/dog_image/비글.png' },
  { label: '시바이누', src: '/dog_image/시바이누.png' },
  { label: '에스키모', src: '/dog_image/에스키모.png' },
  { label: '요크셔테리어', src: '/dog_image/요크셔테리어.png' },
  { label: '웰시코기', src: '/dog_image/웰시코기.png' },
  { label: '치와와', src: '/dog_image/치와와.png' },
  { label: '퍼그', src: '/dog_image/퍼그.png' },
  { label: '푸들', src: '/dog_image/푸들.png' },
  { label: '프렌치불독', src: '/dog_image/프렌치불독.png' },
];

export function getDogImageByName(name?: string | null): string | null {
  if (!name) return null;
  const found = DOG_IMAGES.find((d) => d.label === name.trim());
  return found ? found.src : null;
}

export function getDogImageByBreed(breed?: string | null): string | null {
  if (!breed) return null;
  const found = DOG_IMAGES.find((d) => d.label === breed.trim());
  return found ? found.src : null;
}


