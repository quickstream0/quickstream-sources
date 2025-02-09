import axios from "axios";

export async function getRedirectedUrl(url: string) {
  try {
    // Perform a request to the initial URL
    const response = await axios.get(url, {
      maxRedirects: 0,  // Prevent axios from following redirects automatically
      validateStatus: (status) => status >= 300 && status < 400,  // Only handle redirects
    });

    // Check if the 'Location' header exists in the response
    const redirectedUrl = response.headers.location;
    if (redirectedUrl) {
      return redirectedUrl;
    } else {
      throw new Error('No redirection found');
    }
  } catch (error) {
    console.error(`Error fetching redirected URL:`, error);
    throw error;
  }
}

export async function getFinalRedirectedUrl(url: string) {
  try {
    const response = await axios.get(url, { maxRedirects: 0, validateStatus: (status) => status < 400 });

    // Check for a Location header first (for standard redirects)
    const redirectUrl = response.headers.location;
    if (redirectUrl) {
      return redirectUrl.startsWith("http") ? redirectUrl : new URL(redirectUrl, url).href;
    }

    // If no Location header, fall back to checking the JavaScript
    const scriptRedirectUrl = extractRedirectUrl(response.data);
    if (scriptRedirectUrl) {
      return scriptRedirectUrl;
    }

    // If neither is found, return the original URL (indicating no redirection)
    return url;
  } catch (error) {
    console.error(`Error fetching redirected URL:`, error);
    throw error;
  }
}

// Function to extract the redirection URL from the script
function extractRedirectUrl(data: string): string | null {
  const match = data.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

// Main function to fetch and handle redirection
export async function getRedirectedUrlWithTokenCheck(url: string) {
  try {
    const response = await axios.get(url);
    
    // Extract the redirect URL if available
    const redirectUrl = extractRedirectUrl(response.data);
    
    if (redirectUrl) {
      return redirectUrl; // Return the extracted URL if found in the script
    }
    
    throw new Error("No redirect URL found in script");
  } catch (error) {
    console.error(`Error fetching redirected URL:`, error);
    throw error;
  }
}
