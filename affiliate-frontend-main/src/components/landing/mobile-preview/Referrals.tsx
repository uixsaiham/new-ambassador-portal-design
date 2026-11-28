// Mobile app design adapted from the supplied Figma file.
const imgIconChevronRight = "/landing/mobile/3ee66892-fd64-46e8-85a5-4f868c3cb9a4.svg";
const imgWiFi = "/landing/mobile/cb79f881-f1a5-4ea4-bfb2-083bddf8e574.svg";
const imgIconSearch = "/landing/mobile/5b26d603-a322-4274-99a4-ff3df25813f6.svg";
const imgIconPlus = "/landing/mobile/10c006b6-0879-4148-ac19-cde0c5e34944.svg";
const imgIconWhatsapp = "/landing/mobile/605ea0d3-7506-413a-b1d5-b0130eb84137.svg";
const imgIconHome = "/landing/mobile/77ac01dd-b942-41d3-8721-a74302d24779.svg";
const imgIconReferrals = "/landing/mobile/9b2d6a3c-1e9c-4f7c-b539-af1f773de7af.svg";
const imgIconPlus1 = "/landing/mobile/b23aa33c-4de3-4399-9e1b-d3ae0c3e37fb.svg";
const imgIconWallet = "/landing/mobile/532ac4a0-5d94-468e-a3dd-51bd3e5ddf9e.svg";
const imgIconProfile = "/landing/mobile/85fbad5d-5e36-41f8-a194-403697870a2a.svg";

function IconChevronRight({ className }: { className?: string }) {
  return (
    <div className={className || "relative size-[24px]"} data-node-id="4:65" data-name="Icon/chevron-right">
      <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconChevronRight} />
    </div>
  );
}

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

export default function Referrals() {
  return (
    <div className="bg-[var(--color-bg-page,#faf8f6)] content-stretch flex flex-col items-start pb-[120px] relative size-full" data-node-id="182:492" data-name="Referrals">
      <StatusBar className="content-stretch flex h-[54px] items-center pt-[2px] px-[16px] relative shrink-0 w-full" />
      <div className="content-stretch flex gap-[10px] items-center overflow-clip px-[24px] py-[8px] relative shrink-0 w-full" data-node-id="182:511" data-name="Header">
        <div className="content-stretch flex flex-[1_0_0] items-start min-w-px overflow-clip relative" data-node-id="182:512" data-name="Frame">
          <p className="[word-break:break-word] flex-[1_0_0]  font-extrabold leading-[36px] min-w-px relative text-[30px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.75px]" data-node-id="182:513">
            Referrals
          </p>
        </div>
        <div className="border border-[var(--color-border-default,#e5e2eb)] border-solid content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:514" data-name="Search">
          <div className="relative shrink-0 size-[20px]" data-node-id="182:515" data-name="Icon/search">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconSearch} />
          </div>
        </div>
        <a className="bg-[var(--color-bg-brand,#283270)] content-stretch cursor-pointer flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:518" data-name="Add referral">
          <div className="relative shrink-0 size-[20px]" data-node-id="182:519" data-name="Icon/plus">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
          </div>
        </a>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pb-[20px] px-[24px] relative shrink-0 w-full" data-node-id="182:521" data-name="Sub">
        <div className="[word-break:break-word] content-stretch flex gap-[6px] items-start overflow-clip relative shrink-0 text-[14px] whitespace-nowrap" data-node-id="182:522" data-name="Frame">
          <p className=" font-normal leading-[21px] relative shrink-0 text-[color:var(--color-text-secondary,#6b6882)]" data-node-id="182:523">
            9 friends ·
          </p>
          <p className=" font-bold leading-[0] relative shrink-0 text-[color:var(--color-text-primary,#1a1832)]" data-node-id="182:524">
            <span className="font-[family-name:var(--font-bengali)] leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳
            </span>
            <span className="leading-[21px]">25,600 in review</span>
          </p>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[12px] items-start overflow-clip pb-[22px] px-[24px] relative shrink-0 w-full" data-node-id="182:525" data-name="Pipeline">
        <div className="content-stretch flex gap-[2px] items-start overflow-clip relative shrink-0 w-full" data-node-id="182:526" data-name="Stage bar">
          <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.22))] flex-[3_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="182:528" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.42))] flex-[2_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="182:534" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.68))] flex-[2_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="182:540" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-brand,#283270)] flex-[1_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="182:546" data-name="Rectangle" />
          <div className="bg-[var(--color-bg-accent,#ea6d28)] flex-[1_0_0] h-[10px] min-w-px relative rounded-[2px]" data-node-id="182:552" data-name="Rectangle" />
        </div>
        <div className="content-stretch flex items-start justify-between overflow-clip relative shrink-0 w-full" data-node-id="182:527" data-name="Legend">
          <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0" data-node-id="182:529" data-name="Frame">
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="182:530" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.22))] relative rounded-[2px] shrink-0 size-[7px]" data-node-id="182:531" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:532">
                3
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:533">
              Enquired
            </p>
          </div>
          <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0" data-node-id="182:535" data-name="Frame">
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="182:536" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.42))] relative rounded-[2px] shrink-0 size-[7px]" data-node-id="182:537" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:538">
                2
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:539">
              Potential
            </p>
          </div>
          <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0" data-node-id="182:541" data-name="Frame">
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="182:542" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.68))] relative rounded-[2px] shrink-0 size-[7px]" data-node-id="182:543" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:544">
                2
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:545">
              Applied
            </p>
          </div>
          <div className="content-stretch flex flex-col items-center overflow-clip relative shrink-0" data-node-id="182:547" data-name="Frame">
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="182:548" data-name="Frame">
              <div className="bg-[var(--color-bg-brand,#283270)] relative rounded-[2px] shrink-0 size-[7px]" data-node-id="182:549" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:550">
                1
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:551">
              Offer
            </p>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="182:553" data-name="Frame">
            <div className="content-stretch flex gap-[5px] items-center overflow-clip relative shrink-0" data-node-id="182:554" data-name="Frame">
              <div className="bg-[var(--color-bg-accent,#ea6d28)] relative rounded-[2px] shrink-0 size-[7px]" data-node-id="182:555" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-extrabold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:556">
                1
              </p>
            </div>
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:557">
              Enrolled
            </p>
          </div>
        </div>
      </div>
      <div className="[word-break:break-word] content-stretch flex gap-[8px] items-start leading-[18px] overflow-clip pb-[8px] px-[24px] relative shrink-0 text-[13px] w-full whitespace-nowrap" data-node-id="182:558" data-name="Filters">
        <div className="bg-[var(--color-text-primary,#1a1832)] content-stretch flex gap-[6px] items-start overflow-clip px-[14px] py-[9px] relative rounded-[999px] shrink-0" data-node-id="182:559" data-name="Frame">
          <p className=" font-semibold relative shrink-0 text-[color:var(--color-text-inverse,white)]" data-node-id="182:560">
            All
          </p>
          <p className=" font-medium relative shrink-0 text-[color:var(--color-text-inverse,rgba(255,255,255,0.6))]" data-node-id="182:561">
            9
          </p>
        </div>
        <div className="border border-[var(--color-border-default,#e5e2eb)] border-solid content-stretch flex gap-[6px] items-start overflow-clip px-[14px] py-[9px] relative rounded-[999px] shrink-0" data-node-id="182:562" data-name="Frame">
          <p className=" font-semibold relative shrink-0 text-[color:var(--color-text-primary,#1a1832)]" data-node-id="182:563">
            Needs you
          </p>
          <p className=" font-medium relative shrink-0 text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="182:564">
            1
          </p>
        </div>
        <div className="border border-[var(--color-border-default,#e5e2eb)] border-solid content-stretch flex gap-[6px] items-start overflow-clip px-[14px] py-[9px] relative rounded-[999px] shrink-0" data-node-id="182:565" data-name="Frame">
          <p className=" font-semibold relative shrink-0 text-[color:var(--color-text-primary,#1a1832)]" data-node-id="182:566">
            In progress
          </p>
          <p className=" font-medium relative shrink-0 text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="182:567">
            6
          </p>
        </div>
        <div className="border border-[var(--color-border-default,#e5e2eb)] border-solid content-stretch flex gap-[6px] items-start overflow-clip px-[14px] py-[9px] relative rounded-[999px] shrink-0" data-node-id="182:568" data-name="Frame">
          <p className=" font-semibold relative shrink-0 text-[color:var(--color-text-primary,#1a1832)]" data-node-id="182:569">
            Enrolled
          </p>
          <p className=" font-medium relative shrink-0 text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="182:570">
            1
          </p>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pt-[18px] px-[24px] relative shrink-0 w-full" data-node-id="182:571" data-name="Needs you">
        <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="182:572" data-name="Frame">
          <div className="bg-[var(--color-bg-accent,#ea6d28)] h-[12px] relative shrink-0 w-[3px]" data-node-id="182:573" data-name="Rectangle" />
          <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-accent,#c4531a)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="182:574">
            NEEDS YOU
          </p>
          <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-tertiary,#9895aa)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="182:575">
            1
          </p>
        </div>
        <div className="h-[6px] relative shrink-0 w-[10px]" data-node-id="182:576" data-name="Gap" />
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:577" data-name="Hairline" />
        <a className="content-stretch cursor-pointer flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="182:578" data-name="Row / Rafiul Islam">
          <div className="bg-[var(--color-bg-accent-soft,#fef2ea)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:579" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-accent,#c4531a)] text-left whitespace-nowrap" data-node-id="182:580">
              RI
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="182:581" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] text-left whitespace-nowrap" data-node-id="182:582">
              Rafiul Islam
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis text-left w-[min-content] whitespace-nowrap" data-node-id="182:583">
              MSc Data Science · Northbridge
            </p>
            <div className="content-stretch flex gap-[8px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="182:584" data-name="Frame">
              <div className="content-stretch flex gap-[3px] items-start overflow-clip relative shrink-0" data-node-id="182:585" data-name="Stage">
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:586" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:587" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:588" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:589" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:590" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-accent,#c4531a)] text-left whitespace-nowrap" data-node-id="182:591">
                IELTS certificate needed
              </p>
            </div>
          </div>
          <div className="border border-[var(--color-border-strong,#c9c6d4)] border-solid content-stretch flex gap-[8px] items-center justify-center overflow-clip pl-[14px] pr-[16px] py-[9px] relative rounded-[999px] shrink-0" data-node-id="182:592" data-name="Button · Remind">
            <div className="relative shrink-0 size-[15px]" data-node-id="182:593" data-name="Icon/whatsapp">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconWhatsapp} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-primary,#1a1832)] text-left whitespace-nowrap" data-node-id="182:596">
              Remind
            </p>
          </div>
        </a>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:597" data-name="Hairline" />
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pt-[26px] px-[24px] relative shrink-0 w-full" data-node-id="182:598" data-name="In progress">
        <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="182:599" data-name="Frame">
          <div className="bg-[var(--color-bg-accent,#ea6d28)] h-[12px] relative shrink-0 w-[3px]" data-node-id="182:600" data-name="Rectangle" />
          <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-accent,#c4531a)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="182:601">
            IN PROGRESS
          </p>
          <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-tertiary,#9895aa)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="182:602">
            6
          </p>
        </div>
        <div className="h-[6px] relative shrink-0 w-[10px]" data-node-id="182:603" data-name="Gap" />
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:604" data-name="Hairline" />
        <div className="content-stretch flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="182:605" data-name="Row / Tasnia Rahman">
          <div className="bg-[var(--color-bg-brand-tint,#e6e8f4)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:606" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] whitespace-nowrap" data-node-id="182:607">
              TR
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="182:608" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:609">
              Tasnia Rahman
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-[min-content] whitespace-nowrap" data-node-id="182:610">
              MSc Finance · Northbridge
            </p>
            <div className="content-stretch flex gap-[8px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="182:611" data-name="Frame">
              <div className="content-stretch flex gap-[3px] items-start overflow-clip relative shrink-0" data-node-id="182:612" data-name="Stage">
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:613" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:614" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:615" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:616" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:617" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:618">
                Offer received
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="182:619" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:620">
              Yesterday
            </p>
            <IconChevronRight className="relative shrink-0 size-[16px]" />
          </div>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:623" data-name="Hairline" />
        <div className="content-stretch flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="182:624" data-name="Row / Mehedi Hasan">
          <div className="bg-[var(--color-bg-muted,#e8e5e2)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:625" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-secondary,#6b6882)] whitespace-nowrap" data-node-id="182:626">
              MH
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="182:627" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:628">
              Mehedi Hasan
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-[min-content] whitespace-nowrap" data-node-id="182:629">
              BSc Computer Science · Mapleton
            </p>
            <div className="content-stretch flex gap-[8px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="182:630" data-name="Frame">
              <div className="content-stretch flex gap-[3px] items-start overflow-clip relative shrink-0" data-node-id="182:631" data-name="Stage">
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:632" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:633" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:634" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:635" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:636" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:637">
                Applied
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="182:638" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:639">
              1 Dec
            </p>
            <IconChevronRight className="relative shrink-0 size-[16px]" />
          </div>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:642" data-name="Hairline" />
        <div className="content-stretch flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="182:643" data-name="Row / Sadia Akter">
          <div className="bg-[var(--color-bg-brand-tint,#e6e8f4)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:644" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] whitespace-nowrap" data-node-id="182:645">
              SA
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="182:646" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:647">
              Sadia Akter
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-[min-content] whitespace-nowrap" data-node-id="182:648">
              January MBA · Westmoor
            </p>
            <div className="content-stretch flex gap-[8px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="182:649" data-name="Frame">
              <div className="content-stretch flex gap-[3px] items-start overflow-clip relative shrink-0" data-node-id="182:650" data-name="Stage">
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:651" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:652" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:653" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:654" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:655" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:656">
                Potential
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="182:657" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:658">
              29 Nov
            </p>
            <IconChevronRight className="relative shrink-0 size-[16px]" />
          </div>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:661" data-name="Hairline" />
        <div className="content-stretch flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="182:662" data-name="Row / Farhan Kabir">
          <div className="bg-[var(--color-bg-muted,#e8e5e2)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:663" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-secondary,#6b6882)] whitespace-nowrap" data-node-id="182:664">
              FK
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="182:665" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:666">
              Farhan Kabir
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-[min-content] whitespace-nowrap" data-node-id="182:667">
              MA Economics · Northbridge
            </p>
            <div className="content-stretch flex gap-[8px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="182:668" data-name="Frame">
              <div className="content-stretch flex gap-[3px] items-start overflow-clip relative shrink-0" data-node-id="182:669" data-name="Stage">
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:670" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:671" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:672" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:673" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:674" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:675">
                Potential
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="182:676" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:677">
              3 Dec
            </p>
            <IconChevronRight className="relative shrink-0 size-[16px]" />
          </div>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:680" data-name="Hairline" />
        <a className="content-stretch cursor-pointer flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="182:681" data-name="Row / Arif Hossain">
          <div className="bg-[var(--color-bg-muted,#e8e5e2)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:682" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-secondary,#6b6882)] text-left whitespace-nowrap" data-node-id="182:683">
              AH
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="182:684" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] text-left whitespace-nowrap" data-node-id="182:685">
              Arif Hossain
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis text-left w-[min-content] whitespace-nowrap" data-node-id="182:686">
              Engineering 2027 · Riverside Tech
            </p>
            <div className="content-stretch flex gap-[8px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="182:687" data-name="Frame">
              <div className="content-stretch flex gap-[3px] items-start overflow-clip relative shrink-0" data-node-id="182:688" data-name="Stage">
                <div className="bg-[var(--color-bg-brand,#283270)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:689" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:690" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:691" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:692" data-name="Rectangle" />
                <div className="bg-[var(--color-bg-muted,#e8e5e2)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:693" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[0] relative shrink-0 text-[#ea6d28] text-[12px] text-left whitespace-nowrap" data-node-id="182:694">
                <span className="leading-[17px]">{`Add documents · earn `}</span>
                <span className="font-[family-name:var(--font-bengali)] font-bold leading-[17px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  ৳
                </span>
                <span className="leading-[17px]">300</span>
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="182:695" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-left whitespace-nowrap" data-node-id="182:696">
              Today
            </p>
            <IconChevronRight className="relative shrink-0 size-[16px]" />
          </div>
        </a>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:699" data-name="Hairline" />
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pt-[26px] px-[24px] relative shrink-0 w-full" data-node-id="182:700" data-name="Enrolled">
        <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="182:701" data-name="Frame">
          <div className="bg-[var(--color-bg-accent,#ea6d28)] h-[12px] relative shrink-0 w-[3px]" data-node-id="182:702" data-name="Rectangle" />
          <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-accent,#c4531a)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="182:703">
            ENROLLED
          </p>
          <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-tertiary,#9895aa)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="182:704">
            1
          </p>
        </div>
        <div className="h-[6px] relative shrink-0 w-[10px]" data-node-id="182:705" data-name="Gap" />
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:706" data-name="Hairline" />
        <div className="content-stretch flex gap-[14px] items-center overflow-clip py-[14px] relative shrink-0 w-full" data-node-id="182:707" data-name="Row / Nabila Chowdhury">
          <div className="bg-[var(--color-bg-success,#e8f6ee)] content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="182:708" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-success,#15803d)] whitespace-nowrap" data-node-id="182:709">
              NC
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[3px] items-start min-w-px overflow-clip relative" data-node-id="182:710" data-name="Frame">
            <p className="[word-break:break-word]  font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="182:711">
              Nabila Chowdhury
            </p>
            <p className="[word-break:break-word]  font-normal leading-[17px] min-w-full overflow-hidden relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] text-ellipsis w-[min-content] whitespace-nowrap" data-node-id="182:712">
              MSc Finance · Northbridge
            </p>
            <div className="content-stretch flex gap-[8px] items-center overflow-clip pt-[4px] relative shrink-0" data-node-id="182:713" data-name="Frame">
              <div className="content-stretch flex gap-[3px] items-start overflow-clip relative shrink-0" data-node-id="182:714" data-name="Stage">
                <div className="bg-[var(--color-icon-success,#15803d)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:715" data-name="Rectangle" />
                <div className="bg-[var(--color-icon-success,#15803d)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:716" data-name="Rectangle" />
                <div className="bg-[var(--color-icon-success,#15803d)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:717" data-name="Rectangle" />
                <div className="bg-[var(--color-icon-success,#15803d)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:718" data-name="Rectangle" />
                <div className="bg-[var(--color-icon-success,#15803d)] h-[3px] relative rounded-[2px] shrink-0 w-[16px]" data-node-id="182:719" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word]  font-semibold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-success,#15803d)] whitespace-nowrap" data-node-id="182:720">
                Verifying enrolment
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-end overflow-clip relative shrink-0" data-node-id="182:721" data-name="Frame">
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="182:722">
              Sep 2026
            </p>
            <IconChevronRight className="relative shrink-0 size-[16px]" />
          </div>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="182:725" data-name="Hairline" />
      </div>
      <div className="absolute bottom-0 h-[90px] left-0 right-0" data-node-id="200:7643" data-name="Tab Bar">
        <div className="absolute backdrop-blur-[12px] bg-[var(--surface\/glass,rgba(255,255,255,0.82))] border border-[rgba(255,255,255,0.55)] border-solid content-stretch drop-shadow-[0px_10px_15px_rgba(13,15,38,0.14)] flex items-start left-[20px] p-[6px] rounded-[34px] top-[4px]" data-node-id="I200:7643;194:8094" data-name="Glass Pill">
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7643;194:8095" data-name="Tab/Home">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7643;198:611" data-name="Icon/home">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconHome} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7643;194:8097">
              Home
            </p>
          </a>
          <div className="bg-[#dbdded] content-stretch flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7643;194:8098" data-name="Tab/Referrals">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7643;198:613" data-name="Icon/referrals">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconReferrals} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[12px] relative shrink-0 text-[#283270] text-[11px] tracking-[0.1px] whitespace-nowrap" data-node-id="I200:7643;194:8100">
              Referrals
            </p>
          </div>
          <div className="content-stretch flex flex-col gap-[8px] h-[56px] items-center justify-center relative shrink-0 w-[69.6px]" data-node-id="I200:7643;198:625" data-name="Tab/Refer">
            <a className="-translate-x-1/2 absolute border-4 border-solid border-white content-stretch cursor-pointer flex items-center justify-center left-1/2 overflow-clip rounded-[30px] shadow-[0px_8px_18px_0px_rgba(235,110,41,0.4)] size-[60px] top-[-34px]" data-node-id="I200:7643;198:626" style={{ backgroundImage: "linear-gradient(135deg, rgb(250, 148, 77) 0%, rgb(227, 92, 26) 71.429%)" }} data-name="Refer button">
              <div className="relative shrink-0 size-[28px]" data-node-id="I200:7643;198:627" data-name="Icon/plus">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus1} />
              </div>
            </a>
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7643;203:647" data-name="Icon slot" />
            <p className="[word-break:break-word]  font-bold leading-[12px] relative shrink-0 text-[#ea6d28] text-[11px] whitespace-nowrap" data-node-id="I200:7643;203:648">
              Refer
            </p>
          </div>
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7643;194:8101" data-name="Tab/Wallet">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7643;198:618" data-name="Icon/wallet">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconWallet} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7643;194:8103">
              Wallet
            </p>
          </a>
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7643;194:8104" data-name="Tab/Profile">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7643;198:622" data-name="Icon/profile">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconProfile} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7643;194:8106">
              Profile
            </p>
          </a>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute bg-[var(--color-text-primary,#1a1832)] bottom-[8px] h-[5px] left-1/2 rounded-[3px] w-[134px]" data-node-id="182:788" data-name="Home Indicator" />
    </div>
  );
}
