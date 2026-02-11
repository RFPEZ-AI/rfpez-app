# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of RFPEZ.AI seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Reporting Process

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **[your-security-email@example.com]**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

### Preferred Languages

We prefer all communications to be in English.

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution**: Varies based on severity and complexity

### What to Expect

- We will acknowledge your email within 48 hours
- We will provide a more detailed response within 7 days indicating the next steps
- We will keep you informed about our progress toward a fix
- We may ask for additional information or guidance

### Disclosure Policy

- We request that you give us a reasonable amount of time to respond to your report before making any information public
- We aim to resolve critical issues within 30 days of initial report
- Once the issue is resolved, we will coordinate public disclosure with you
- We will credit you in the disclosure unless you prefer to remain anonymous

## Security Best Practices for Contributors

### Environment Variables

- **NEVER** commit `.env`, `.env.local`, or any files containing secrets
- Always use `.env.example` with placeholder values
- Use GitHub Secrets for CI/CD credentials
- Rotate credentials if accidentally exposed

### Code Security

- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization checks
- Sanitize data before rendering in UI
- Keep dependencies up to date

### API Keys and Secrets

- Store secrets in environment variables only
- Never hardcode API keys or passwords in source code
- Use different credentials for dev/staging/production
- Rotate credentials regularly (quarterly minimum)

### Pull Requests

- Review code for security vulnerabilities before submitting
- Enable secret scanning in your fork
- Run security linters before committing
- Document security considerations in PR description

## Known Security Considerations

### Database Access

- All database operations use Row Level Security (RLS)
- User authentication required for sensitive operations
- SQL injection prevented through parameterized queries

### API Integration

- Claude API: Uses API keys with request signing
- Supabase: Uses JWT tokens with short expiration
- AWS Bedrock: Uses IAM credentials with least privilege

### Frontend Security

- Content Security Policy (CSP) headers configured
- XSS prevention through React's built-in escaping
- CORS configured for trusted origins only

### Edge Functions

- Environment variables used for secrets
- Request validation on all endpoints
- Rate limiting implemented
- Authentication required for sensitive operations

## Security Tools

This repository uses:

- **GitHub Secret Scanning**: Automatically detects exposed secrets
- **Dependabot**: Monitors dependencies for vulnerabilities
- **git-secrets** (recommended): Pre-commit hook to prevent secret commits

### Setting Up git-secrets

```bash
# Install git-secrets
brew install git-secrets  # Mac
# Or download from: https://github.com/awslabs/git-secrets

# Configure in your local repository
cd rfpez-app
git secrets --install
git secrets --register-aws
git secrets --add 'sk-ant-api[0-9]+-[A-Za-z0-9_-]+'  # Claude keys
git secrets --add 'AKIA[0-9A-Z]{16}'                  # AWS keys
git secrets --add 'pplx-[A-Za-z0-9]+'                 # Perplexity keys
```

## Vulnerability Disclosure

When a security vulnerability is identified and fixed:

1. We will prepare a security advisory
2. We will notify affected users if applicable
3. We will publish a CVE if severity warrants
4. We will credit the researcher (unless anonymity requested)
5. We will document the fix in release notes

## Security Update Policy

- **Critical vulnerabilities**: Fixed within 7 days
- **High severity**: Fixed within 30 days
- **Medium/Low severity**: Fixed in next regular release

Security updates will be clearly marked in release notes and may be released outside the regular release schedule.

## Compliance

This project aims to follow:

- OWASP Top 10 security practices
- CWE/SANS Top 25 Most Dangerous Software Errors
- GitHub Security Best Practices

## Contact

For security concerns, please contact: **[your-security-email@example.com]**

For general questions or non-security issues, please use GitHub Issues.

---

**Last Updated**: February 10, 2026

This security policy is subject to change. Please check back regularly for updates.
