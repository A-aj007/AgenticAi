import Head from 'next/head';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Agentflow_AI — Agentic AI Operations Automation Platform</title>
        <meta
          name="description"
          content="Natural-language to executable visual workflow platform with multi-agent orchestration and OAuth integrations."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
