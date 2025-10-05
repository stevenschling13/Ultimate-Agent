# Ultimate-Agent

## API key configuration

Ultimate-Agent no longer ships with any hard-coded API credentials. To run the
project you must supply your own OpenAI API key at runtime using secure
mechanisms such as:

- Exporting the `OPENAI_API_KEY` environment variable in your local shell or
  runtime environment manager.
- Storing the secret in your operating system's keychain, password manager, or
  dedicated secrets vault and injecting it into the environment at launch.
- Configuring CI/CD pipelines or container orchestration platforms (e.g.,
  GitHub Actions, Docker secrets, Kubernetes Secrets, or HashiCorp Vault) to
  provide the key to the application as an environment variable at runtime.

When using Docker Compose, `OPENAI_API_KEY` must be supplied externally before
starting the stack. Compose will refuse to start if the variable is missing,
ensuring that no default or placeholder key is accidentally used.

## Security notice

The previously committed OpenAI API key has been revoked. A replacement secret
has been provisioned through the team's secure secret-distribution channels
(e.g., environment variable management in deployment environments, CI/CD secret
stores, and vault services). Request access from your project administrator if
you require the updated credential.

## Local environment setup

1. Copy `agent-orchestrator/.env.example` to `agent-orchestrator/.env`.
2. Populate the `OPENAI_API_KEY` value with your real key (do **not** commit
   this file).
3. Ensure the `OPENAI_API_KEY` environment variable is set when running
   services locally or via Docker Compose.
