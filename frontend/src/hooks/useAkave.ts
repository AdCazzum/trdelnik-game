import { useCallback } from 'react';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// aws configure set aws_secret_access_key sk_2wS8MJIR7nL9YuE2NLZoFhkDJfE1ySC46TCTH3zIJ2tnTyoHFJzd2wS8MJIR7nL9YuE2NLZoFhkDJfE1ySC46TCTH3zIJ2tnTyoHFJzd --profile akave
const AKAVE_ACCESS_KEY = import.meta.env.VITE_AKAVE_ACCESS_KEY;
const AKAVE_SECRET_KEY = import.meta.env.VITE_AKAVE_SECRET_KEY;
const AKAVE_BUCKET = import.meta.env.VITE_AKAVE_BUCKET;
const AKAVE_ENDPOINT = import.meta.env.VITE_AKAVE_ENDPOINT;

// Initialize S3 client
const s3Client = new S3Client({
  region: 'us-east-1', // Required but not used by Akave
  endpoint: AKAVE_ENDPOINT,
  credentials: {
    accessKeyId: AKAVE_ACCESS_KEY || '',
    secretAccessKey: AKAVE_SECRET_KEY || '',
  },
  forcePathStyle: true, // Required for Akave
});

export interface GameData {
  gameId: number;
  player: string;
  difficulty: string;
  bet: string;
  result: 'win' | 'loss';
  steps: number;
  timestamp: number;
  stepHistory: {
    step: number;
    success: boolean;
    timestamp: number;
  }[];
  transactionHash?: string;
  payout?: string;
  multiplier?: string;
}

export const useAkave = () => {
  const saveGameData = useCallback(async (gameData: GameData) => {
    try {
      const key = `game-${gameData.gameId}.json`;
      const command = new PutObjectCommand({
        Bucket: AKAVE_BUCKET,
        Key: key,
        Body: JSON.stringify(gameData),
        ContentType: 'application/json',
        ACL: 'public-read',
      });

      await s3Client.send(command);
      console.log('Game data saved to Akave:', gameData);
      return true;
    } catch (error) {
      console.error('Error saving game data to Akave:', error);
      return false;
    }
  }, []);

  const getGameData = useCallback(async (gameId: number): Promise<GameData | null> => {
    try {
      const key = `game-${gameId}.json`;
      const command = new GetObjectCommand({
        Bucket: AKAVE_BUCKET,
        Key: key,
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        return null;
      }

      const data = await response.Body.transformToString();
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting game data from Akave:', error);
      return null;
    }
  }, []);

  const deleteGameData = useCallback(async (gameId: number) => {
    try {
      const key = `game-${gameId}.json`;
      const command = new DeleteObjectCommand({
        Bucket: AKAVE_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
      console.log('Game data deleted from Akave:', gameId);
      return true;
    } catch (error) {
      console.error('Error deleting game data from Akave:', error);
      return false;
    }
  }, []);

  const getGameDataUrl = useCallback(async (gameId: number): Promise<string | null> => {
    try {
      const key = `game-${gameId}.json`;
      const command = new GetObjectCommand({
        Bucket: AKAVE_BUCKET,
        Key: key,
      });

      // Generate a signed URL that expires in 1 hour
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return null;
    }
  }, []);

  return {
    saveGameData,
    getGameData,
    deleteGameData,
    getGameDataUrl,
  };
}; 