import Image from "next/image";
import MobileShowcase from "./MobileShowcase";
// Layout and local assets adapted from the supplied Figma design.
const imgIconUsers = "/landing/8641979b-3d04-408a-a698-6a7b353761c9.svg";
const imgIconWallet = "/landing/19ea8003-3740-4686-a31d-51fa4cd0272b.svg";
const imgEllipse = "/landing/d7172351-7538-4c39-8b65-c648bc9a91db.svg";
const imgEllipse1 = "/landing/a4deceba-8307-4c82-b16d-c15a4415f8d5.svg";
const imgIconQr = "/landing/c85b7af0-a2ca-416c-8b1e-c17e3a3e36bb.svg";
const imgIconBell = "/landing/fa6c5219-51eb-44ff-bfde-b24cba6da1c6.svg";
const imgEllipse2 = "/landing/6044627c-73c8-4255-ae5a-ae59d854f08b.svg";
const imgEllipse3 = "/landing/1c52e9aa-96f5-4975-8728-b6fec2200dab.svg";
const imgIconShieldCheck = "/landing/1f0fb322-78a0-4992-92d8-7447be41b5ff.svg";

export default function Features() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[56px] items-center px-[80px] py-[112px] relative size-full" data-node-id="295:873" data-name="Features">
      <div className="[word-break:break-word] content-stretch flex flex-col gap-[14px] items-center relative shrink-0" data-node-id="295:874" data-name="Heading">
        <h2 className=" font-extrabold leading-[52px] relative shrink-0 text-[#292c43] text-[44px] text-center tracking-[-1.1px] w-[760px]" data-node-id="295:876">
          Everything you need, on every screen.
        </h2>
        <p className=" font-medium leading-[26px] relative shrink-0 text-[#5e5a6b] text-[17px] text-center w-[620px]" data-node-id="295:877">
          Your desktop portal and mobile app, connected around your ambassador journey.
        </p>
      </div>
      <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-node-id="295:878" data-name="Frame">
        <div className="bg-white border border-[#e8e5e0] border-solid content-stretch flex flex-col gap-[12px] items-start p-[28px] relative rounded-[12px] self-stretch shrink-0 w-[800px]" data-node-id="295:880" data-hover-card="true" data-name="Frame">
          <div className="bg-[#efecf3] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="295:881" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="295:882" data-name="Icon/users">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconUsers} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[27px] relative shrink-0 text-[#292c43] text-[19px] tracking-[-0.19px] whitespace-nowrap" data-node-id="295:887">
            Track every referral
          </p>
          <p className="[word-break:break-word]  font-medium leading-[21px] min-w-full relative shrink-0 text-[#5e5a6b] text-[14px] w-[min-content]" data-node-id="295:888">
            See exactly where each friend is, from lead to verified, applied, offer and enrolled.
          </p>
          <div className="bg-[#faf8f6] content-stretch flex flex-col gap-[10px] items-start p-[16px] relative rounded-[10px] shrink-0 w-full" data-node-id="295:889" data-name="Visual">
            <div className="bg-white content-stretch flex gap-[14px] items-center px-[12px] py-[10px] relative rounded-[8px] shrink-0 w-full" data-node-id="295:890" data-name="Frame">
              <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[#292c43] text-[13px] w-[110px]" data-node-id="295:891">
                Nusrat Jahan
              </p>
              <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-start min-w-px relative" data-node-id="295:892" data-name="Frame">
                <div className="bg-[#1f9d6b] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:893" data-name="Rectangle" />
                <div className="bg-[#1f9d6b] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:894" data-name="Rectangle" />
                <div className="bg-[#1f9d6b] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:895" data-name="Rectangle" />
                <div className="bg-[#1f9d6b] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:896" data-name="Rectangle" />
                <div className="bg-[#1f9d6b] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:897" data-name="Rectangle" />
              </div>
              <div className="bg-[#e3f4ec] content-stretch flex items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="295:898" data-name="Frame">
                <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[#1f9d6b] text-[12px] whitespace-nowrap" data-node-id="295:899">
                  Enrolled
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[14px] items-center px-[12px] py-[10px] relative rounded-[8px] shrink-0 w-full" data-node-id="295:900" data-name="Frame">
              <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[#292c43] text-[13px] w-[110px]" data-node-id="295:901">
                Rafi Ahmed
              </p>
              <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-start min-w-px relative" data-node-id="295:902" data-name="Frame">
                <div className="bg-[#293171] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:903" data-name="Rectangle" />
                <div className="bg-[#293171] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:904" data-name="Rectangle" />
                <div className="bg-[#293171] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:905" data-name="Rectangle" />
                <div className="bg-[#293171] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:906" data-name="Rectangle" />
                <div className="bg-[#efecf3] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:907" data-name="Rectangle" />
              </div>
              <div className="bg-[#efecf3] content-stretch flex items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="295:908" data-name="Frame">
                <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[#293171] text-[12px] whitespace-nowrap" data-node-id="295:909">
                  Offer
                </p>
              </div>
            </div>
            <div className="bg-white content-stretch flex gap-[14px] items-center px-[12px] py-[10px] relative rounded-[8px] shrink-0 w-full" data-node-id="295:910" data-name="Frame">
              <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[#292c43] text-[13px] w-[110px]" data-node-id="295:911">
                Tanvir Hasan
              </p>
              <div className="content-stretch flex flex-[1_0_0] gap-[4px] items-start min-w-px relative" data-node-id="295:912" data-name="Frame">
                <div className="bg-[#293171] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:913" data-name="Rectangle" />
                <div className="bg-[#293171] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:914" data-name="Rectangle" />
                <div className="bg-[#efecf3] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:915" data-name="Rectangle" />
                <div className="bg-[#efecf3] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:916" data-name="Rectangle" />
                <div className="bg-[#efecf3] flex-[1_0_0] h-[6px] min-w-px relative rounded-[3px]" data-node-id="295:917" data-name="Rectangle" />
              </div>
              <div className="bg-[#efecf3] content-stretch flex items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="295:918" data-name="Frame">
                <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[#293171] text-[12px] whitespace-nowrap" data-node-id="295:919">
                  Verified
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#e8e5e0] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px p-[28px] relative rounded-[12px] self-stretch" data-node-id="295:920" data-hover-card="true" data-name="Frame">
          <div className="bg-[#fdede4] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="295:921" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="295:922" data-name="Icon/wallet">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconWallet} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[27px] relative shrink-0 text-[#292c43] text-[19px] tracking-[-0.19px] whitespace-nowrap" data-node-id="295:926">
            Your wallet
          </p>
          <p className="[word-break:break-word]  font-medium leading-[21px] min-w-full relative shrink-0 text-[#5e5a6b] text-[14px] w-[min-content]" data-node-id="295:927">
            Watch your balance grow and request a payout anytime.
          </p>
          <div className="bg-[#faf8f6] content-stretch flex flex-col gap-[10px] items-start p-[16px] relative rounded-[10px] shrink-0 w-full" data-node-id="295:928" data-name="Visual">
            <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[#5e5a6b] text-[12px] whitespace-nowrap" data-node-id="295:929">
              Available to withdraw
            </p>
            <p className="[word-break:break-word]  font-extrabold leading-[0] relative shrink-0 text-[#f26925] text-[34px] tracking-[-0.68px] whitespace-nowrap" data-node-id="295:930">
              <span className="font-[family-name:var(--font-bengali)] leading-[40px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                ৳
              </span>
              <span className="leading-[40px]">2,100</span>
            </p>
            <div className="content-stretch flex gap-[8px] items-start relative shrink-0" data-node-id="295:931" data-name="Frame">
              <div className="bg-[#fbf1de] content-stretch flex gap-[6px] items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="295:932" data-name="Frame">
                <div className="relative shrink-0 size-[6px]" data-node-id="295:933" data-name="Ellipse">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
                </div>
                <p className="[word-break:break-word]  font-bold leading-[0] relative shrink-0 text-[#b7791f] text-[12px] whitespace-nowrap" data-node-id="295:934">
                  <span className="leading-[17px]">{`In review `}</span>
                  <span className="font-[family-name:var(--font-bengali)] leading-[17px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                    ৳
                  </span>
                  <span className="leading-[17px]">500</span>
                </p>
              </div>
              <div className="bg-[#e3f4ec] content-stretch flex gap-[6px] items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="295:935" data-name="Frame">
                <div className="relative shrink-0 size-[6px]" data-node-id="295:936" data-name="Ellipse">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} />
                </div>
                <p className="[word-break:break-word]  font-bold leading-[0] relative shrink-0 text-[#1f9d6b] text-[12px] whitespace-nowrap" data-node-id="295:937">
                  <span className="leading-[17px]">{`Paid `}</span>
                  <span className="font-[family-name:var(--font-bengali)] leading-[17px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                    ৳
                  </span>
                  <span className="leading-[17px]">1,000</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-stretch flex gap-[24px] items-start relative shrink-0 w-full" data-node-id="295:879" data-name="Frame">
        <div className="bg-white border border-[#e8e5e0] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px p-[28px] relative rounded-[12px] self-stretch" data-node-id="295:938" data-hover-card="true" data-name="Frame">
          <div className="bg-[#efecf3] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="295:939" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="295:940" data-name="Icon/qr">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconQr} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[27px] relative shrink-0 text-[#292c43] text-[19px] tracking-[-0.19px] whitespace-nowrap" data-node-id="295:945">
            Share in one tap
          </p>
          <p className="[word-break:break-word]  font-medium leading-[21px] min-w-full relative shrink-0 text-[#5e5a6b] text-[14px] w-[min-content]" data-node-id="295:946">
            Copy your link, show a QR code, or share straight to WhatsApp and Messenger.
          </p>
          <div className="bg-[#faf8f6] content-stretch flex flex-col items-start p-[16px] relative rounded-[10px] shrink-0 w-full" data-node-id="295:947" data-name="Visual">
            <div className="content-stretch flex gap-[14px] items-center relative shrink-0" data-node-id="295:948" data-name="Frame">
              <div className="bg-white content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[72px]" data-node-id="295:949" data-name="Frame">
                <div className="content-stretch flex flex-col gap-[3px] items-start relative shrink-0" data-node-id="295:950" data-name="Frame">
                  <div className="content-stretch flex gap-[3px] items-start relative shrink-0" data-node-id="295:951" data-name="Frame">
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:952" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:953" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:954" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:955" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:956" data-name="Rectangle" />
                  </div>
                  <div className="content-stretch flex gap-[3px] items-start relative shrink-0" data-node-id="295:957" data-name="Frame">
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:958" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:959" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:960" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:961" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:962" data-name="Rectangle" />
                  </div>
                  <div className="content-stretch flex gap-[3px] items-start relative shrink-0" data-node-id="295:963" data-name="Frame">
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:964" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:965" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:966" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:967" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:968" data-name="Rectangle" />
                  </div>
                  <div className="content-stretch flex gap-[3px] items-start relative shrink-0" data-node-id="295:969" data-name="Frame">
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:970" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:971" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:972" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:973" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:974" data-name="Rectangle" />
                  </div>
                  <div className="content-stretch flex gap-[3px] items-start relative shrink-0" data-node-id="295:975" data-name="Frame">
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:976" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:977" data-name="Rectangle" />
                    <div className="bg-[#efecf3] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:978" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:979" data-name="Rectangle" />
                    <div className="bg-[#292c43] relative rounded-[1.5px] shrink-0 size-[9px]" data-node-id="295:980" data-name="Rectangle" />
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0" data-node-id="295:981" data-name="Frame">
                <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[#292c43] text-[13px] whitespace-nowrap" data-node-id="295:982">
                  bheuni.io/r/SAIH910
                </p>
                <div className="bg-[#e3f4ec] content-stretch flex gap-[6px] items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="295:983" data-name="Frame">
                  <div className="relative shrink-0 size-[6px]" data-node-id="295:984" data-name="Ellipse">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} />
                  </div>
                  <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[#1f9d6b] text-[12px] whitespace-nowrap" data-node-id="295:985">
                    Copied!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#e8e5e0] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px p-[28px] relative rounded-[12px] self-stretch" data-node-id="295:986" data-hover-card="true" data-name="Frame">
          <div className="bg-[#e3f4ec] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="295:987" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="295:988" data-name="Icon/bell">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBell} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[27px] relative shrink-0 text-[#292c43] text-[19px] tracking-[-0.19px] whitespace-nowrap" data-node-id="295:991">
            Instant updates
          </p>
          <p className="[word-break:break-word]  font-medium leading-[21px] min-w-full relative shrink-0 text-[#5e5a6b] text-[14px] w-[min-content]" data-node-id="295:992">
            Get notified the moment a friend is verified or a payout is sent.
          </p>
          <div className="bg-[#faf8f6] content-stretch flex flex-col gap-[10px] items-start p-[16px] relative rounded-[10px] shrink-0 w-full" data-node-id="295:993" data-name="Visual">
            <div className="bg-white content-stretch flex gap-[10px] items-center px-[12px] py-[10px] relative rounded-[8px] shrink-0 w-full" data-node-id="295:994" data-name="Frame">
              <div className="relative shrink-0 size-[8px]" data-node-id="295:995" data-name="Ellipse">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse2} />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[0] relative shrink-0 text-[#292c43] text-[13px] whitespace-nowrap" data-node-id="295:996">
                <span className="leading-[18px]">Nusrat was verified · +</span>
                <span className="font-[family-name:var(--font-bengali)] leading-[18px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  ৳
                </span>
                <span className="leading-[18px]">300</span>
              </p>
            </div>
            <div className="bg-white content-stretch flex gap-[10px] items-center px-[12px] py-[10px] relative rounded-[8px] shrink-0 w-full" data-node-id="295:997" data-name="Frame">
              <div className="relative shrink-0 size-[8px]" data-node-id="295:998" data-name="Ellipse">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse3} />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[0] relative shrink-0 text-[#292c43] text-[13px] whitespace-nowrap" data-node-id="295:999">
                <span className="leading-[18px]">{`Payout of `}</span>
                <span className="font-[family-name:var(--font-bengali)] leading-[18px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  ৳
                </span>
                <span className="leading-[18px]">1,000 sent to bKash</span>
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-[#e8e5e0] border-solid content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px p-[28px] relative rounded-[12px] self-stretch" data-node-id="295:1000" data-hover-card="true" data-name="Frame">
          <div className="bg-[#fbf1de] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[40px]" data-node-id="295:1001" data-name="Frame">
            <div className="relative shrink-0 size-[20px]" data-node-id="295:1002" data-name="Icon/shield-check">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconShieldCheck} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[27px] relative shrink-0 text-[#292c43] text-[19px] tracking-[-0.19px] whitespace-nowrap" data-node-id="295:1005">
            Secure sign-in
          </p>
          <p className="[word-break:break-word]  font-medium leading-[21px] min-w-full relative shrink-0 text-[#5e5a6b] text-[14px] w-[min-content]" data-node-id="295:1006">
            Sign in with Google and a verified mobile number. No passwords to remember.
          </p>
          <div className="bg-[#faf8f6] content-stretch flex flex-col items-start p-[16px] relative rounded-[10px] shrink-0 w-full" data-node-id="295:1007" data-name="Visual">
            <div className="bg-white content-stretch flex gap-[10px] items-center px-[12px] py-[10px] relative rounded-[8px] shrink-0 w-full" data-node-id="295:1008" data-name="Frame">
              <Image src="/landing/google-g.png" alt="Google" width={18} height={18} unoptimized className="shrink-0" />
              <p className="[word-break:break-word] flex-[1_0_0]  font-semibold leading-[18px] min-w-px relative text-[#292c43] text-[13px]" data-node-id="295:1010">
                nusrat.jahan…@gmail.com
              </p>
              <div className="bg-[#e3f4ec] content-stretch flex gap-[6px] items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="295:1011" data-name="Frame">
                <div className="relative shrink-0 size-[6px]" data-node-id="295:1012" data-name="Ellipse">
                  <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} />
                </div>
                <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[#1f9d6b] text-[12px] whitespace-nowrap" data-node-id="295:1013">
                  Verified
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MobileShowcase />
    </div>
  );
}
