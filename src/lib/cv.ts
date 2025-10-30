export interface CvApiResponse {
  id: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

const API_BASE = "/api/cv";

const parseError = async (response: Response): Promise<Error> => {
  let details: string | undefined;
  try {
    const body = await response.json();
    details = typeof body === "string" ? body : body?.error ?? body?.message;
  } catch (error) {
    details = await response.text().catch(() => undefined);
  }

  const message = details ? `${response.status} ${response.statusText} - ${details}` : `${response.status} ${response.statusText}`;
  return new Error(`CV API request failed: ${message}`);
};

export const fetchCVData = async (): Promise<CvApiResponse | null> => {
  const response = await fetch(API_BASE, {
    headers: { "Accept": "application/json" },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const data = await response.json();
  return data ? (data as CvApiResponse) : null;
};

export const uploadCVFile = async (file: File): Promise<CvApiResponse> => {
  const formData = new FormData();
  formData.append("file", file, file.name);

  const response = await fetch(API_BASE, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as CvApiResponse;
};

export const deleteCVFile = async (): Promise<void> => {
  const response = await fetch(API_BASE, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 204) {
    throw await parseError(response);
  }
};
