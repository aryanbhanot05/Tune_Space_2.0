/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_AWS_ACCESS_KEY_ID: string;
    EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY: string;
    EXPO_PUBLIC_SPOTIFY_CLIENT_ID: string;
  }
}