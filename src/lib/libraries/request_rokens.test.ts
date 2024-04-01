import { describe, it, expect } from 'vitest';
import { checkBearerToken, fetchBearerToken } from './request_tokens';

describe('request_tokens', () => {
    describe('checkBearerToken', () => {
        it('should return true if the bearer token is correct', () => {
            const url = new URL('https://example.com?password=test');
            const req = new Request('https://example.com');
            expect(checkBearerToken(url, req)).toBe(true);
        });

        it('should return false if the bearer token is incorrect', () => {
            const url = new URL('https://example.com?password=incorrect');
            const req = new Request('https://example.com');
            expect(checkBearerToken(url, req)).toBe(false);
        });
    });

    describe('fetchBearerToken', () => {
        it('should return the password from the request headers', () => {
            const url = new URL('https://example.com');
            const req = new Request('https://example.com', { headers: { password: 'correct' } });
            expect(fetchBearerToken(url, req)).toBe('correct');
        });
        
        it('should return the password from the URL search params', () => {
            const url = new URL('https://example.com');
            const req = new Request('https://example.com', { headers: { password: 'incorrect' } });
            expect(fetchBearerToken(url, req)).toBe('incorrect');
        });

        it('should return an empty string if no password is found', () => {
            const url = new URL('https://example.com');
            const req = new Request('https://example.com');
            expect(fetchBearerToken(url, req)).toBe('');
        });
    });
});