/**
 * Utility function to convert relative image paths to absolute URLs
 * Handles both relative paths and full URLs with incorrect hostname
 * Uses the API base URL from environment variables
 */
export const getAbsoluteImageUrl = (imagePath?: string): string => {
  if (!imagePath) {
    return "/image/logo.svg";
  }

  // Get the correct API base URL from environment
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

  // If it's already a full URL, check if hostname is wrong
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    // Extract the path part from the URL
    try {
      const url = new URL(imagePath);
      const pathname = url.pathname; // e.g., "/uploads/profilePic-xxx.jpg"
      
      // Reconstruct with correct API base
      return `${apiBase}${pathname}`;
    } catch (e) {
      // If URL parsing fails, return as is
      return imagePath;
    }
  }

  // If it starts with /, construct with API base
  if (imagePath.startsWith("/")) {
    // Check if it already has /uploads/ in it
    if (imagePath.includes("/uploads/")) {
      return `${apiBase}${imagePath}`;
    }
    return `${apiBase}${imagePath}`;
  }

  // For relative paths like "filename.jpg", prepend /uploads/
  const finalUrl = `${apiBase}/uploads/${imagePath}`;
  


  return finalUrl;
};
