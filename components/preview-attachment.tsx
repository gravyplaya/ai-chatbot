import Image from "next/image";
import type { Attachment } from "@/lib/types";
import { Loader } from "./elements/loader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CrossSmallIcon, DownloadIcon, InfoIcon } from "./icons";
import { Button } from "./ui/button";

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;
  const isImage = contentType?.startsWith("image");

  return (
    <div
      className="group relative size-64 overflow-hidden rounded-lg border bg-muted"
      data-testid="input-attachment-preview"
    >
      {isImage ? (
        <Image
          alt={name ?? "An image attachment"}
          className="size-full object-cover"
          height={256}
          src={url}
          width={256}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
          File
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader size={16} />
        </div>
      )}

      {onRemove && !isUploading && (
        <Button
          className="absolute top-0.5 right-0.5 size-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={onRemove}
          size="sm"
          variant="destructive"
        >
          <CrossSmallIcon size={8} />
        </Button>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
        {isImage ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon size={14} className="text-white" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="truncate text-[10px] text-white">{name}</div>
        )}
        {isImage && !isUploading && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-gray-300"
          >
            <DownloadIcon size={14} />
          </a>
        )}
      </div>
    </div>
  );
};
