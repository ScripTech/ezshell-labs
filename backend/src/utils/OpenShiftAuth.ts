import axios, { AxiosError } from "axios";

interface ValidateUserAuthenticationOptions {
  username: string;
  password: string;
  apiServer: string; // e.g., https://api.example.com:6443
}

class OpenShiftAuth {
  private async validateUserAuthentication({
    username,
    password,
    apiServer,
  }: ValidateUserAuthenticationOptions): Promise<boolean> {
    // Sanitize inputs to prevent injection (basic validation)
    if (
      !username ||
      !password ||
      !apiServer ||
      /[^a-zA-Z0-9-_@.]/.test(username)
    ) {
      console.error(
        `Invalid input: username=${username}, apiServer=${apiServer}`
      );
      return false;
    }

    try {
      // Construct OAuth token endpoint
      const tokenUrl = `${apiServer}/oauth/authorize`;

      // Request token using username and password (htpasswd-provider)
      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: "password",
          username,
          password,
          client_id: "openshift-challenging-client",
          response_type: "token",
        }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
            // Skip TLS verification for lab environments
            "X-Csrf-Token": "1",
          },
          httpsAgent: new (require("https").Agent)({
            rejectUnauthorized: false,
          }),
        }
      );

      // Successful response indicates valid authentication
      if (response.status === 200 && response.data?.access_token) {
        console.log(`User ${username} authenticated successfully`);
        return true;
      }

      console.log(`User ${username} authentication failed: No token received`);
      return false;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error(
          `Authentication error for user ${username}:`,
          error.response?.data?.message || error.message
        );
        // Handle specific HTTP status codes
        if (error.response?.status === 401 || error.response?.status === 403) {
          return false; // Invalid credentials
        }
      } else {
        console.error(
          `Unexpected error for user ${username}:`,
          (error as Error).message
        );
      }
      return false;
    }
  }
}
