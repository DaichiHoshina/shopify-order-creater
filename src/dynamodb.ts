/**
 * DynamoDB操作モジュール
 */

import { DynamoDBClient, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBSessionItem, ShopifySession } from './types';

/**
 * DynamoDBクライアントを作成
 */
export function createDynamoDBClient(region: string, profile?: string): DynamoDBClient {
  // プロファイルが指定されている場合は、AWS SDKが自動的に~/.aws/credentialsから読み込む
  if (profile) {
    process.env.AWS_PROFILE = profile;
  }
  
  return new DynamoDBClient({ region });
}

/**
 * DynamoDBから指定した開発者名のセッション情報を検索
 */
export async function findSessionsByDeveloperName(
  client: DynamoDBClient,
  tableName: string,
  developerName: string
): Promise<DynamoDBSessionItem[]> {
  console.log(`🔍 Searching for sessions containing: ${developerName}`);
  
  const params: ScanCommandInput = {
    TableName: tableName,
    FilterExpression: 'contains(SessionId, :devName)',
    ExpressionAttributeValues: {
      ':devName': { S: developerName },
    },
  };

  try {
    const command = new ScanCommand(params);
    const response = await client.send(command);

    if (!response.Items || response.Items.length === 0) {
      console.log('⚠️  No sessions found');
      return [];
    }

    console.log(`✅ Found ${response.Items.length} session(s)`);
    
    const items = response.Items.map((item) => unmarshall(item) as DynamoDBSessionItem);
    return items;
  } catch (error) {
    console.error('❌ Error scanning DynamoDB:', error);
    throw error;
  }
}

/**
 * セッションデータからofflineセッションを抽出
 */
export function extractOfflineSession(sessionItem: DynamoDBSessionItem): ShopifySession | null {
  try {
    // session_idフィールドをチェック
    const sessionId = sessionItem.session_id || sessionItem.SessionId;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return null;
    }

    // "offline"を含むかチェック
    if (!sessionId.includes('offline')) {
      return null;
    }

    // sessionフィールドからJSON文字列をパース
    const sessionData = sessionItem.session;
    if (!sessionData || typeof sessionData !== 'string') {
      return null;
    }

    const parsedSession = JSON.parse(sessionData) as ShopifySession;
    return parsedSession;
  } catch (error) {
    console.error('⚠️  Failed to parse session:', error);
    return null;
  }
}

/**
 * セッション情報からX-Shopify-Access-Tokenを取得
 */
export function extractAccessToken(session: ShopifySession): string | null {
  const token = session.accessToken;
  
  if (!token) {
    console.error('❌ Access token not found in session');
    return null;
  }

  console.log('✅ Access token extracted successfully');
  return token;
}

/**
 * メイン処理: DynamoDBからアクセストークンを取得
 */
export async function getAccessTokenFromDynamoDB(
  region: string,
  tableName: string,
  developerName: string,
  profile?: string
): Promise<string | null> {
  const client = createDynamoDBClient(region, profile);
  
  // 1. セッション情報を検索
  const sessions = await findSessionsByDeveloperName(client, tableName, developerName);
  
  if (sessions.length === 0) {
    console.error('❌ No sessions found for the specified developer name');
    return null;
  }

  // 2. offlineセッションを抽出
  console.log('\n🔍 Searching for offline sessions...');
  
  for (const sessionItem of sessions) {
    const offlineSession = extractOfflineSession(sessionItem);
    
    if (offlineSession) {
      console.log(`✅ Found offline session: ${offlineSession.id}`);
      
      // 3. アクセストークンを抽出
      const token = extractAccessToken(offlineSession);
      
      if (token) {
        return token;
      }
    }
  }

  console.error('❌ No offline session with access token found');
  return null;
}
