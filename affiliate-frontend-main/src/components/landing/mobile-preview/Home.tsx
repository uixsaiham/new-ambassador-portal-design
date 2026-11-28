// Mobile app design adapted from the supplied Figma file.
const imgWiFi = "/landing/mobile/767cf056-5bb6-488a-99e5-47812c6fb295.svg";
const imgImage = "/landing/mobile/06681839-4658-4ab9-8855-229b171866ff.png";
const imgNotifications = "/landing/mobile/bff4a770-99d7-4ef8-84b6-bcc4ba93e324.svg";
const imgIconArrowRight = "/landing/mobile/6dc62b04-d06c-4382-b828-13b128f95299.svg";
const imgEllipse = "/landing/mobile/712bf506-2860-4e51-ae12-3dc45242f3c6.svg";
const imgEllipse1 = "/landing/mobile/b5523302-d1ea-45b4-b6b2-d5eb3fe1892b.svg";
const imgIconWhatsapp = "/landing/mobile/c9df4287-e5aa-4fc0-9f51-5c706a3f2665.svg";
const imgIconChevronRight = "/landing/mobile/674d815d-de7b-4865-841f-41f4ae8cb2c9.svg";
const imgIconCopy = "/landing/mobile/a2798a2d-dd84-4671-bb77-45c4ccacbf6f.svg";
const imgIconQr = "/landing/mobile/142e965e-b85c-4f84-9d5f-2d22dd0c46fd.svg";
const imgIconShare = "/landing/mobile/6c68a374-a274-4437-96d5-c106b7857a3a.svg";
const imgEllipse2 = "/landing/mobile/02eb3d59-47f6-4acf-8875-32f324d4e210.svg";
const imgIconShare1 = "/landing/mobile/c7eba782-22ed-46cf-8f40-9109869d95c0.svg";
const imgIconHome = "/landing/mobile/889da443-dd77-4f4e-98f8-1080f9026345.svg";
const imgIconReferrals = "/landing/mobile/274771a3-95e9-4a99-a455-4861563017ec.svg";
const imgIconPlus = "/landing/mobile/cb7dc68e-0e6f-4493-87d3-e9392e31bdd0.svg";
const imgIconWallet = "/landing/mobile/3edcd4fe-dfc8-41bb-9cd7-ad9549cc4d8c.svg";
const imgIconProfile = "/landing/mobile/b324d050-5fa5-493f-bef0-8e68ad5389db.svg";

type StatusBarProps = {
  className?: string;
  theme?: "Light";
};

function StatusBar({ className, theme = "Light" }: StatusBarProps) {
  return (
    <div className={className || "content-stretch flex h-[54px] items-center pt-[2px] px-[16px] relative w-[402px]"} data-node-id="109:577">
      <div className="content-stretch flex flex-[1_0_0] items-center justify-center min-w-px overflow-clip relative" data-node-id="109:578" data-name="Left">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#0a0a0f] text-[17px] tracking-[-0.17px] whitespace-nowrap" data-node-id="109:579">
          9:41
        </p>
      </div>
      <div className="bg-black h-[37px] relative rounded-[18.5px] shrink-0 w-[125px]" data-node-id="109:580" data-name="Dynamic Island" />
      <div className="content-stretch flex flex-[1_0_0] gap-[7px] items-center justify-center min-w-px overflow-clip relative" data-node-id="109:581" data-name="Right">
        <div className="content-stretch flex gap-[2px] items-end overflow-clip relative shrink-0" data-node-id="109:582" data-name="Cellular">
          <div className="bg-[#0a0a0f] h-[4px] relative rounded-[1px] shrink-0 w-[3px]" data-node-id="109:583" data-name="Rectangle" />
          <div className="bg-[#0a0a0f] h-[6.5px] relative rounded-[1px] shrink-0 w-[3px]" data-node-id="109:584" data-name="Rectangle" />
          <div className="bg-[#0a0a0f] h-[9px] relative rounded-[1px] shrink-0 w-[3px]" data-node-id="109:585" data-name="Rectangle" />
          <div className="bg-[#0a0a0f] h-[11.5px] relative rounded-[1px] shrink-0 w-[3px]" data-node-id="109:586" data-name="Rectangle" />
        </div>
        <div className="h-[12px] relative shrink-0 w-[16px]" data-node-id="109:587" data-name="Wi-Fi">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgWiFi} />
        </div>
        <div className="content-stretch flex gap-[1.5px] items-center overflow-clip relative shrink-0" data-node-id="109:591" data-name="Battery">
          <div className="border border-[rgba(10,10,15,0.38)] border-solid content-stretch flex h-[12.5px] items-start overflow-clip p-[2px] relative rounded-[4px] shrink-0 w-[25px]" data-node-id="109:592" data-name="Body">
            <div className="bg-[#0a0a0f] flex-[1_0_0] h-full min-w-px relative rounded-[2.2px]" data-node-id="109:593" data-name="Level" />
          </div>
          <div className="bg-[rgba(10,10,15,0.4)] h-[4px] relative rounded-[1px] shrink-0 w-[1.5px]" data-node-id="109:594" data-name="Cap" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="bg-[var(--color-bg-page,#faf8f6)] content-stretch flex flex-col items-start pb-[110px] relative size-full" data-node-id="179:223" data-name="Home">
      <StatusBar className="content-stretch flex h-[54px] items-center pt-[2px] px-[16px] relative shrink-0 w-full" />
      <div className="content-stretch flex flex-col items-start overflow-clip pt-[10px] px-[24px] relative shrink-0 w-full" data-node-id="179:225" data-name="Header">
        <div className="content-stretch flex gap-[12px] items-center overflow-clip relative shrink-0 w-full" data-node-id="179:226" data-name="Frame">
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="179:227" data-name="Frame">
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="179:228">
              Thu, 10 December
            </p>
            <p className=" font-semibold leading-[24px] relative shrink-0 text-[17px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.1px]" data-node-id="179:229">
              Good evening, Nusrat
            </p>
          </div>
          <div className="border border-[var(--color-border-default,#e5e2eb)] border-solid content-stretch flex items-start overflow-clip px-[10px] py-[6px] relative rounded-[999px] shrink-0" data-node-id="179:230" data-name="Frame">
            <p className="[word-break:break-word] font-[family-name:var(--font-bengali)] font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-secondary,#6b6882)] whitespace-nowrap" data-node-id="179:231" style={{ fontVariationSettings: '"wdth" 100' }}>
              বাংলা
            </p>
          </div>
          <a className="block cursor-pointer relative shrink-0 size-[30px]" data-node-id="179:232" data-name="Notifications">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgNotifications} />
          </a>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pb-[28px] pt-[36px] px-[24px] relative shrink-0 w-full" data-node-id="179:235" data-name="Balance">
        <p className="[word-break:break-word]  font-medium leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-secondary,#6b6882)] whitespace-nowrap" data-node-id="179:236">
          Available to withdraw
        </p>
        <div className="content-stretch flex gap-[12px] items-baseline overflow-clip relative shrink-0 w-full" data-node-id="179:237" data-name="Frame">
          <p className="[word-break:break-word] flex-[1_0_0]  font-extrabold leading-[0] min-w-px relative text-[0px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-1.92px]" data-node-id="179:238">
            <span className="font-[family-name:var(--font-bengali)] font-bold leading-[68px] text-[48px]" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳
            </span>
            <span className="leading-[68px] text-[48px]">2,100</span>
          </p>
          <a className="bg-[var(--color-bg-brand,#283270)] content-stretch cursor-pointer flex gap-[6px] items-center overflow-clip pl-[16px] pr-[14px] py-[10px] relative rounded-[999px] shrink-0" data-node-id="179:239" data-name="Withdraw">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-inverse,white)] text-left whitespace-nowrap" data-node-id="179:240">
              Request payout
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="179:241" data-name="Icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </a>
        </div>
        <div className="h-[14px] relative shrink-0 w-[10px]" data-node-id="179:242" data-name="Frame" />
        <div className="content-stretch flex gap-[20px] items-center overflow-clip relative shrink-0" data-node-id="179:243" data-name="Frame">
          <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="179:244" data-name="Frame">
            <div className="relative shrink-0 size-[6px]" data-node-id="179:245" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:246">
              <span className="font-[family-name:var(--font-bengali)] leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                ৳
              </span>
              <span className="leading-[21px]">25,600</span>
            </p>
            <p className="[word-break:break-word]  font-normal leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:247">
              in review
            </p>
          </div>
          <div className="bg-[var(--color-border-default,#e5e2eb)] h-[16px] relative shrink-0 w-px" data-node-id="179:248" data-name="Rectangle" />
          <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="179:249" data-name="Frame">
            <div className="relative shrink-0 size-[6px]" data-node-id="179:250" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:251">
              <span className="font-[family-name:var(--font-bengali)] leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                ৳
              </span>
              <span className="leading-[21px]">1,500</span>
            </p>
            <p className="[word-break:break-word]  font-normal leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:252">
              paid out
            </p>
          </div>
        </div>
        <div className="h-[6px] relative shrink-0 w-[10px]" data-node-id="179:253" data-name="Frame" />
        <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:254">
          Nabila’s enrolment and 2 leads are being verified.
        </p>
      </div>
      <div className="content-stretch flex flex-col gap-[10px] items-start overflow-clip pb-[32px] px-[24px] relative shrink-0 w-full" data-node-id="179:255" data-name="Needs you">
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="179:256" data-name="Hairline" />
        <div className="h-[14px] relative shrink-0 w-[10px]" data-node-id="179:257" data-name="Frame" />
        <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="179:258" data-name="Frame">
          <div className="bg-[var(--color-bg-accent,#ea6d28)] h-[12px] relative shrink-0 w-[3px]" data-node-id="179:259" data-name="Rectangle" />
          <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-accent,#c4531a)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="179:260">
            NEEDS YOU · 1
          </p>
        </div>
        <p className="[word-break:break-word]  font-semibold leading-[28px] min-w-full relative shrink-0 text-[21px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.21px] w-[min-content]" data-node-id="179:261">
          Rafiul’s application is waiting on his IELTS certificate.
        </p>
        <p className="[word-break:break-word]  font-normal leading-[21px] min-w-full relative shrink-0 text-[14px] text-[color:var(--color-text-secondary,#6b6882)] w-[min-content]" data-node-id="179:262">
          Northbridge starts its 3–5 day review once it’s uploaded. A nudge from you usually helps.
        </p>
        <div className="content-stretch cursor-pointer flex gap-[16px] items-center overflow-clip pt-[6px] relative shrink-0" data-node-id="179:263" data-name="Frame">
          <a className="border border-[var(--color-border-strong,#c9c6d4)] border-solid content-stretch flex gap-[8px] items-center overflow-clip pl-[14px] pr-[16px] py-[10px] relative rounded-[999px] shrink-0" data-node-id="179:264" data-name="Remind on WhatsApp">
            <div className="relative shrink-0 size-[16px]" data-node-id="179:265" data-name="Icon/whatsapp">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconWhatsapp} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-primary,#1a1832)] text-left whitespace-nowrap" data-node-id="179:266">
              Remind Rafiul
            </p>
          </a>
          <a className="content-stretch flex gap-[4px] items-center overflow-clip relative shrink-0" data-node-id="179:267" data-name="Open referral">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] text-left whitespace-nowrap" data-node-id="179:268">
              Open referral
            </p>
            <div className="relative shrink-0 size-[14px]" data-node-id="179:269" data-name="Icon/chevron-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronRight} />
            </div>
          </a>
        </div>
      </div>
      <div className="bg-[var(--color-bg-brand,#283270)] content-stretch flex flex-col gap-[14px] items-start overflow-clip p-[24px] relative shrink-0 w-full" data-node-id="179:270" data-name="Your link">
        <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-inverse,rgba(255,255,255,0.55))] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="179:271">
          YOUR REFERRAL LINK
        </p>
        <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0 w-full" data-node-id="179:272" data-name="Frame">
          <p className="[word-break:break-word] flex-[1_0_0]  font-bold leading-[28px] min-w-px relative text-[22px] text-[color:var(--color-text-inverse,white)] tracking-[-0.22px]" data-node-id="179:273">
            va.link/nusrat24
          </p>
          <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-start overflow-clip p-[10px] relative rounded-[999px] shrink-0" data-node-id="179:274" data-name="Link · copy">
            <div className="relative shrink-0 size-[18px]" data-node-id="179:275" data-name="Icon/copy">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCopy} />
            </div>
          </div>
          <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex items-start overflow-clip p-[10px] relative rounded-[999px] shrink-0" data-node-id="179:276" data-name="Link · qr">
            <div className="relative shrink-0 size-[18px]" data-node-id="179:277" data-name="Icon/qr">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconQr} />
            </div>
          </div>
          <a className="bg-[var(--color-bg-accent,#ea6d28)] content-stretch cursor-pointer flex items-start overflow-clip p-[10px] relative rounded-[999px] shrink-0" data-node-id="179:278" data-name="Link · share">
            <div className="relative shrink-0 size-[18px]" data-node-id="179:279" data-name="Icon/share">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconShare} />
            </div>
          </a>
        </div>
        <div className="[word-break:break-word] content-stretch flex gap-[18px] items-start overflow-clip relative shrink-0 whitespace-nowrap" data-node-id="179:280" data-name="Frame">
          <div className="content-stretch flex gap-[6px] items-baseline overflow-clip relative shrink-0" data-node-id="179:281" data-name="Frame">
            <p className=" font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-inverse,white)]" data-node-id="179:282">
              42
            </p>
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-inverse,rgba(255,255,255,0.6))]" data-node-id="179:283">
              clicks this week
            </p>
          </div>
          <div className="content-stretch flex gap-[6px] items-baseline overflow-clip relative shrink-0" data-node-id="179:284" data-name="Frame">
            <p className=" font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-inverse,white)]" data-node-id="179:285">
              3
            </p>
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-inverse,rgba(255,255,255,0.6))]" data-node-id="179:286">
              new enquiries
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[14px] items-start overflow-clip pb-[8px] pt-[32px] px-[24px] relative shrink-0 w-full" data-node-id="179:287" data-name="Pipeline">
        <div className="[word-break:break-word] content-stretch flex items-baseline overflow-clip relative shrink-0 w-full" data-node-id="179:288" data-name="Frame">
          <p className="flex-[1_0_0]  font-semibold leading-[24px] min-w-px relative text-[17px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.1px]" data-node-id="179:289">
            Your referrals
          </p>
          <a className="block cursor-pointer  font-bold leading-[0] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] whitespace-nowrap" data-node-id="179:290">
            <p className="leading-[18px]">See all 9</p>
          </a>
        </div>
        <div className="content-stretch flex gap-[2px] items-start overflow-clip relative shrink-0 w-full" data-node-id="179:291" data-name="Stage bar">
          <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.22))] flex-[3_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="179:292" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.42))] flex-[2_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="179:293" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.68))] flex-[2_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="179:294" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-brand,#283270)] flex-[1_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="179:295" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-accent,#ea6d28)] flex-[1_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="179:296" data-name="Rectangle" />
        </div>
        <div className="content-stretch flex items-start justify-between overflow-clip relative shrink-0 w-full" data-node-id="179:297" data-name="Stage labels">
          <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0" data-node-id="179:298" data-name="Frame">
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="179:299" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.22))] relative rounded-[2px] shrink-0 size-[8px]" data-node-id="179:300" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:301">
                3
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:302">
              Enquired
            </p>
          </div>
          <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0" data-node-id="179:303" data-name="Frame">
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="179:304" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.42))] relative rounded-[2px] shrink-0 size-[8px]" data-node-id="179:305" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:306">
                2
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:307">
              Potential
            </p>
          </div>
          <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0" data-node-id="179:308" data-name="Frame">
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="179:309" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.68))] relative rounded-[2px] shrink-0 size-[8px]" data-node-id="179:310" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:311">
                2
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:312">
              Applied
            </p>
          </div>
          <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0" data-node-id="179:313" data-name="Frame">
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="179:314" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,#283270)] relative rounded-[2px] shrink-0 size-[8px]" data-node-id="179:315" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:316">
                1
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:317">
              Offer
            </p>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="179:318" data-name="Frame">
            <div className="content-stretch flex gap-[6px] items-center overflow-clip relative shrink-0" data-node-id="179:319" data-name="Frame">
              <div className="bg-[var(--color-bg-accent,#ea6d28)] relative rounded-[2px] shrink-0 size-[8px]" data-node-id="179:320" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:321">
                1
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:322">
              Enrolled
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pb-[24px] pt-[14px] px-[24px] relative shrink-0 w-full" data-node-id="179:323" data-name="Recent">
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="179:324" data-name="Hairline" />
        <a className="content-stretch cursor-pointer flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="179:325" data-name="Row / Rafiul Islam">
          <div className="bg-[var(--color-bg-accent-soft,#fef2ea)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="179:326" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-accent,#c4531a)] text-left whitespace-nowrap" data-node-id="179:327">
              RI
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px overflow-clip relative text-left whitespace-nowrap" data-node-id="179:328" data-name="Frame">
            <p className=" font-semibold leading-[21px] overflow-hidden relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] text-ellipsis w-full" data-node-id="179:329">
              Rafiul Islam
            </p>
            <p className=" font-normal leading-[17px] overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-full" data-node-id="179:330">
              MSc Data Science · Northbridge
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[3px] items-end overflow-clip relative shrink-0" data-node-id="179:331" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-left whitespace-nowrap" data-node-id="179:332">
              2h
            </p>
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="179:333" data-name="Frame">
              <div className="relative shrink-0 size-[6px]" data-node-id="179:334" data-name="Ellipse">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] text-left whitespace-nowrap" data-node-id="179:335">
                Documents needed
              </p>
            </div>
          </div>
        </a>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="179:336" data-name="Hairline" />
        <div className="content-stretch flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="179:337" data-name="Row / Tasnia Rahman">
          <div className="bg-[var(--color-bg-brand-tint,#e6e8f4)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="179:338" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] whitespace-nowrap" data-node-id="179:339">
              TR
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="179:340" data-name="Frame">
            <p className=" font-semibold leading-[21px] overflow-hidden relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] text-ellipsis w-full" data-node-id="179:341">
              Tasnia Rahman
            </p>
            <p className=" font-normal leading-[17px] overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-full" data-node-id="179:342">
              MSc Finance · Northbridge
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[3px] items-end overflow-clip relative shrink-0" data-node-id="179:343" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:344">
              Yesterday
            </p>
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="179:345" data-name="Frame">
              <div className="relative shrink-0 size-[6px]" data-node-id="179:346" data-name="Ellipse">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:347">
                Offer received
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="179:348" data-name="Hairline" />
        <div className="content-stretch flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="179:349" data-name="Row / Arif Hossain">
          <div className="bg-[var(--color-bg-muted,#e8e5e2)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="179:350" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-secondary,#6b6882)] whitespace-nowrap" data-node-id="179:351">
              AH
            </p>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="179:352" data-name="Frame">
            <p className=" font-semibold leading-[21px] overflow-hidden relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] text-ellipsis w-full" data-node-id="179:353">
              Arif Hossain
            </p>
            <p className=" font-normal leading-[17px] overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-full" data-node-id="179:354">
              Engineering 2027 · Riverside Tech
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[3px] items-end overflow-clip relative shrink-0" data-node-id="179:355" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:356">
              Mon
            </p>
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="179:357" data-name="Frame">
              <div className="relative shrink-0 size-[6px]" data-node-id="179:358" data-name="Ellipse">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse2} />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:359">
                New enquiry
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="179:360" data-name="Hairline" />
      </div>
      <div className="content-stretch flex flex-col gap-[10px] items-start overflow-clip pb-[32px] pt-[8px] px-[24px] relative shrink-0 w-full" data-node-id="179:361" data-name="Tier">
        <div className="[word-break:break-word] content-stretch flex gap-[8px] items-baseline overflow-clip relative shrink-0 w-full" data-node-id="179:362" data-name="Frame">
          <p className=" font-semibold leading-[24px] relative shrink-0 text-[17px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.1px] whitespace-nowrap" data-node-id="179:363">
            Bronze
          </p>
          <p className="flex-[1_0_0]  font-normal leading-[21px] min-w-px relative text-[14px] text-[color:var(--color-text-secondary,#6b6882)]" data-node-id="179:364">
            9 more verified leads to reach Silver
          </p>
          <p className=" font-extrabold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="179:365">
            6/15
          </p>
        </div>
        <div className="bg-[var(--color-bg-muted,#e8e5e2)] content-stretch flex h-[4px] items-start overflow-clip relative rounded-[2px] shrink-0 w-full" data-node-id="179:366" data-name="Frame">
          <div className="bg-[var(--color-bg-brand,#283270)] h-[4px] relative rounded-[2px] shrink-0 w-[137px]" data-node-id="179:367" data-name="Rectangle" />
        </div>
        <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="179:368">
          Silver adds 10% to every reward you earn.
        </p>
      </div>
      <div className="content-stretch flex flex-col gap-[14px] items-start overflow-clip pb-[8px] px-[24px] relative shrink-0 w-full" data-node-id="179:369" data-name="Campaign">
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="179:370" data-name="Hairline" />
        <div className="relative shrink-0 size-[10px]" data-node-id="179:371" data-name="Frame" />
        <div className="[word-break:break-word] content-stretch flex items-baseline overflow-clip relative shrink-0 w-full" data-node-id="179:372" data-name="Frame">
          <p className="flex-[1_0_0]  font-semibold leading-[24px] min-w-px relative text-[17px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.1px]" data-node-id="179:373">
            Worth sharing this week
          </p>
          <a className="block cursor-pointer  font-bold leading-[0] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] whitespace-nowrap" data-node-id="179:374">
            <p className="leading-[18px]">All campaigns</p>
          </a>
        </div>
        <a className="content-stretch cursor-pointer flex gap-[16px] items-start overflow-clip relative shrink-0 w-full" data-node-id="179:375" data-name="Spotlight">
          <div className="h-[136px] relative rounded-[6px] shrink-0 w-[108px]" data-node-id="179:376" data-name="Image">
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[6px] size-full" src={imgImage} />
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-start min-w-px overflow-clip relative" data-node-id="179:377" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-tertiary,#9895aa)] text-left tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="179:378">
              NORTHBRIDGE UNIVERSITY · UK
            </p>
            <p className="[word-break:break-word]  font-semibold leading-[22px] min-w-full relative shrink-0 text-[16px] text-[color:var(--color-text-primary,#1a1832)] text-left w-[min-content]" data-node-id="179:379">
              50% tuition scholarship for Masters 2027
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-secondary,#6b6882)] text-left whitespace-nowrap" data-node-id="179:380">
              Closes 15 Jan · 36 days left
            </p>
            <div className="[word-break:break-word] content-stretch flex gap-[6px] items-baseline overflow-clip pt-[6px] relative shrink-0 text-left whitespace-nowrap" data-node-id="179:381" data-name="Frame">
              <p className=" font-extrabold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-accent,#c4531a)]" data-node-id="179:382">
                <span className="leading-[21px]">{`Up to `}</span>
                <span className="font-[family-name:var(--font-bengali)] font-bold leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  ৳
                </span>
                <span className="leading-[21px]">25,300</span>
              </p>
              <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="179:383">
                per enrolment
              </p>
            </div>
            <div className="content-stretch cursor-pointer flex gap-[6px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="179:384" data-name="Share campaign">
              <div className="relative shrink-0 size-[14px]" data-node-id="179:385" data-name="Icon/share">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconShare1} />
              </div>
              <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] text-left whitespace-nowrap" data-node-id="179:386">
                Share
              </p>
            </div>
          </div>
        </a>
      </div>
      <div className="absolute bottom-0 h-[90px] left-0 right-0" data-node-id="200:7579" data-name="Tab Bar">
        <div className="absolute backdrop-blur-[12px] bg-[var(--surface\/glass,rgba(255,255,255,0.82))] border border-[rgba(255,255,255,0.55)] border-solid content-stretch drop-shadow-[0px_10px_15px_rgba(13,15,38,0.14)] flex items-start left-[20px] p-[6px] rounded-[34px] top-[4px]" data-node-id="I200:7579;194:8080" data-name="Glass Pill">
          <div className="bg-[#dbdded] content-stretch flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7579;194:8081" data-name="Tab/Home">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7579;198:593" data-name="Icon/home">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconHome} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[12px] relative shrink-0 text-[#283270] text-[11px] tracking-[0.1px] whitespace-nowrap" data-node-id="I200:7579;194:8083">
              Home
            </p>
          </div>
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7579;194:8084" data-name="Tab/Referrals">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7579;198:595" data-name="Icon/referrals">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconReferrals} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7579;194:8086">
              Referrals
            </p>
          </a>
          <div className="content-stretch flex flex-col gap-[8px] h-[56px] items-center justify-center relative shrink-0 w-[69.6px]" data-node-id="I200:7579;215:10126" data-name="Tab/Refer">
            <div className="-translate-x-1/2 absolute border-4 border-solid border-white content-stretch flex items-center justify-center left-1/2 overflow-clip rounded-[30px] shadow-[0px_8px_18px_0px_rgba(235,110,41,0.4)] size-[60px] top-[-34px]" data-node-id="I200:7579;215:10127" style={{ backgroundImage: "linear-gradient(135deg, rgb(250, 148, 77) 0%, rgb(227, 92, 26) 71.429%)" }} data-name="Refer button">
              <div className="relative shrink-0 size-[28px]" data-node-id="I200:7579;215:10128" data-name="Icon/plus">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
              </div>
            </div>
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7579;215:10129" data-name="Icon slot" />
            <p className="[word-break:break-word]  font-bold leading-[12px] relative shrink-0 text-[#ea6d28] text-[11px] whitespace-nowrap" data-node-id="I200:7579;215:10130">
              Refer
            </p>
          </div>
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7579;194:8087" data-name="Tab/Wallet">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7579;198:600" data-name="Icon/wallet">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconWallet} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7579;194:8089">
              Wallet
            </p>
          </a>
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7579;194:8090" data-name="Tab/Profile">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7579;198:604" data-name="Icon/profile">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconProfile} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7579;194:8092">
              Profile
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
