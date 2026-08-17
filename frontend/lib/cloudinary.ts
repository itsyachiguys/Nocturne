export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    original_filename: string;
    resource_type: string;
    format: string;
    bytes: number;
  }
  
  const CLOUDINARY_CLOUD_NAME =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  const CLOUDINARY_UPLOAD_PRESET =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  export function uploadToCloudinary(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      if (!CLOUDINARY_CLOUD_NAME) {
        reject(
          new Error(
            "Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
          )
        );
        return;
      }
  
      if (!CLOUDINARY_UPLOAD_PRESET) {
        reject(
          new Error(
            "Missing NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"
          )
        );
        return;
      }
  
      const formData = new FormData();
  
      formData.append("file", file);
      formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
      );
  
      const xhr = new XMLHttpRequest();
  
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
      );
  
      xhr.upload.addEventListener(
        "progress",
        (event) => {
          if (!event.lengthComputable) return;
  
          const progress = Math.round(
            (event.loaded / event.total) * 100
          );
  
          onProgress?.(progress);
        }
      );
  
      xhr.addEventListener("load", () => {
        if (
          xhr.status >= 200 &&
          xhr.status < 300
        ) {
          try {
            const response =
              JSON.parse(
                xhr.responseText
              ) as CloudinaryUploadResult;
  
            resolve(response);
          } catch {
            reject(
              new Error(
                "Cloudinary returned an invalid response."
              )
            );
          }
  
          return;
        }
  
        try {
          const error = JSON.parse(
            xhr.responseText
          );
  
          reject(
            new Error(
              error?.error?.message ||
                "Cloudinary upload failed."
            )
          );
        } catch {
          reject(
            new Error(
              `Cloudinary upload failed with status ${xhr.status}.`
            )
          );
        }
      });
  
      xhr.addEventListener("error", () => {
        reject(
          new Error(
            "Network error while uploading the file."
          )
        );
      });
  
      xhr.addEventListener("abort", () => {
        reject(
          new Error(
            "File upload was cancelled."
          )
        );
      });
  
      xhr.send(formData);
    });
  }