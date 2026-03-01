"use client";

import "cropperjs/dist/cropper.css";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { useMemo, useRef } from "react";
import type { ReactCropperElement } from "react-cropper";
import Cropper from "react-cropper";

export function CropImageDialog({
	image,
	open,
	onOpenChange,
	onCrop,
	aspectRatio = 1,
	maxWidth = 256,
	maxHeight = 256,
	title,
	saveLabel = "Save",
	outputType,
	quality,
}: {
	image: File | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCrop: (croppedImage: Blob | null) => void;
	aspectRatio?: number;
	maxWidth?: number;
	maxHeight?: number;
	title?: string;
	saveLabel?: string;
	outputType?: string;
	quality?: number;
}) {
	const cropperRef = useRef<ReactCropperElement>(null);

	const getCroppedImage = async () => {
		const cropper = cropperRef.current?.cropper;

		const imageBlob = await new Promise<Blob | null>((resolve) => {
			cropper
				?.getCroppedCanvas({
					maxWidth,
					maxHeight,
				})
				.toBlob(resolve, outputType, quality);
		});

		return imageBlob;
	};

	const imageSrc = useMemo(
		() => image && URL.createObjectURL(image),
		[image],
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div>
					{imageSrc && (
						<Cropper
							src={imageSrc}
							style={{ width: "100%" }}
							initialAspectRatio={Number.isNaN(aspectRatio) ? undefined : aspectRatio}
							aspectRatio={Number.isNaN(aspectRatio) ? undefined : aspectRatio}
							guides={true}
							ref={cropperRef}
						/>
					)}
				</div>
				<DialogFooter>
					<Button
						onClick={async () => {
							onCrop(await getCroppedImage());
							onOpenChange(false);
						}}
					>
						{saveLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
