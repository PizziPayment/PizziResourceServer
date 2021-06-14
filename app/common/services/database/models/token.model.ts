export default interface TokenModel {
    id: number
    access_token: string
    refresh_token: string
    expires_at: Date
    client_id: number
    credential_id: number
}
