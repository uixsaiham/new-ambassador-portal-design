import styles from "@/app/home.module.css";

const questions = [
  ["Who can become an ambassador?", "Anyone in Bangladesh who knows friends or family interested in studying abroad. Sign up free with Google or email. It takes under a minute."],
  ["When does a referral count as a verified lead?", "A BHE Uni counsellor contacts your friend and confirms that they are genuinely interested in studying abroad. You can follow their status in your portal."],
  ["How and when do I get paid?", "Request a payout from your wallet to bKash or your bank. Our finance team reviews your request, sends the money, and adds the transaction ID and receipt to your portal."],
  ["Do I need to create a password?", "You can sign up with Google and verify your mobile number, or use the email signup option."],
  ["Is there a limit to how much I can earn?", "There is no limit on how many friends you can refer. Rewards are subject to verification, eligibility, and the programme’s rewards terms."],
  ["Can I use the portal in Bangla?", "Yes. Your ambassador dashboard supports English and Bangla. Use the language switch in the portal to choose your preferred language."],
];

export default function LandingFaq() {
  return <div className={styles.faq}>
    <div className={styles.faqIntro}><h2>Questions,<br />answered.</h2><p>Can’t find what you need? Our team is happy to help.</p><a href="mailto:ask@bheuni.io">Contact our ambassador team →</a></div>
    <div className={styles.faqList}>{questions.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{question}</span></summary><p>{answer}</p></details>)}</div>
  </div>;
}
