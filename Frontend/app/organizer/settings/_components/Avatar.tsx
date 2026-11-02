import Image from "next/image";

type AvatarProps = {
  imageUrl: string | null;
  fallbackText: string;
  shape: "circle" | "square";
  sizeClassName: string;
  fallbackClassName: string;
};

export default function Avatar({
  imageUrl,
  fallbackText,
  shape,
  sizeClassName,
  fallbackClassName,
}: AvatarProps) {
  const shapeClassName = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    // 名前が隣に表示されるため、画像・文字とも読み上げの対象から外す
    <div
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${sizeClassName} ${shapeClassName} ${
        imageUrl ? "" : fallbackClassName
      }`}
    >
      {imageUrl ? (
        // 画像の保存先が未定のため、next.configを変更せずに表示できるよう最適化を外す
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="96px"
          unoptimized
          className="object-cover"
        />
      ) : (
        fallbackText
      )}
    </div>
  );
}
