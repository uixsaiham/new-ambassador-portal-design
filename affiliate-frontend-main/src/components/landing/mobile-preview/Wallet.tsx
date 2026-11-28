// Mobile app design adapted from the supplied Figma file.
const imgWiFi = "/landing/mobile/61271f6c-46c0-48ac-842f-ea7919bd055b.svg";
const imgIconDownload = "/landing/mobile/829b5d4c-6606-4854-80e9-8dcba63f592a.svg";
const imgIconArrowRight = "/landing/mobile/2085d5f6-ce95-43da-88d7-b9242c74cba9.svg";
const imgEllipse = "/landing/mobile/edada11c-ac38-4f81-9b98-835d0b71ff5a.svg";
const imgEllipse1 = "/landing/mobile/482cd80e-86fe-4b1f-982d-4120d73d2b86.svg";
const imgIconGraduationCap = "/landing/mobile/82296bd5-3da6-4d5b-93ad-967cc683cbec.svg";
const imgIconPhone = "/landing/mobile/17e0272d-3f44-4c96-aa48-68a48a6a33e1.svg";
const imgIconUsers = "/landing/mobile/6210a67f-0a25-4cc0-acb3-7af5e8818b71.svg";
const imgIconPhone1 = "/landing/mobile/d2dd417a-5b5a-4762-95a7-4eecb51da996.svg";
const imgIconHome = "/landing/mobile/dac2f8d5-0150-4da8-b1ca-e2dd2a822d38.svg";
const imgIconReferrals = "/landing/mobile/0546af28-5927-4a53-929b-d65283067265.svg";
const imgIconPlus = "/landing/mobile/e38514c2-b4ec-4e9c-9e1d-07478eea6407.svg";
const imgIconWallet = "/landing/mobile/e2edb37e-0402-4fdf-9b3e-5aedbc103a03.svg";
const imgIconProfile = "/landing/mobile/0199b484-1365-4629-8399-a18f74b5a649.svg";

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

export default function Wallet() {
  return (
    <div className="bg-[var(--color-bg-page,#faf8f6)] content-stretch flex flex-col items-start pb-[120px] relative size-full" data-node-id="183:629" data-name="Wallet">
      <StatusBar className="content-stretch flex h-[54px] items-center pt-[2px] px-[16px] relative shrink-0 w-full" />
      <div className="content-stretch flex gap-[10px] items-center overflow-clip px-[24px] py-[8px] relative shrink-0 w-full" data-node-id="183:648" data-name="Header">
        <div className="content-stretch flex flex-[1_0_0] items-start min-w-px overflow-clip relative" data-node-id="183:649" data-name="Frame">
          <p className="[word-break:break-word] flex-[1_0_0]  font-extrabold leading-[36px] min-w-px relative text-[30px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.75px]" data-node-id="183:650">
            Wallet
          </p>
        </div>
        <div className="border border-[var(--color-border-default,#e5e2eb)] border-solid content-stretch flex items-center justify-center overflow-clip relative rounded-[20px] shrink-0 size-[40px]" data-node-id="183:651" data-name="Statement">
          <div className="relative shrink-0 size-[20px]" data-node-id="183:652" data-name="Icon/download">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDownload} />
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pb-[28px] pt-[18px] px-[24px] relative shrink-0 w-full" data-node-id="183:654" data-name="Balance">
        <p className="[word-break:break-word]  font-medium leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-secondary,#6b6882)] whitespace-nowrap" data-node-id="183:655">
          Available to withdraw
        </p>
        <div className="content-stretch flex gap-[12px] items-center overflow-clip relative shrink-0 w-full" data-node-id="183:656" data-name="Frame">
          <p className="[word-break:break-word] flex-[1_0_0]  font-extrabold leading-[0] min-w-px relative text-[0px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-1.92px]" data-node-id="183:657">
            <span className="font-[family-name:var(--font-bengali)] font-bold leading-[64px] text-[48px]" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳
            </span>
            <span className="leading-[64px] text-[48px]">2,100</span>
          </p>
          <a className="bg-[var(--color-bg-brand,#283270)] content-stretch cursor-pointer flex gap-[8px] items-center justify-center overflow-clip pl-[14px] pr-[16px] py-[10px] relative rounded-[999px] shrink-0" data-node-id="183:658" data-name="Button · Withdraw">
            <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-inverse,white)] text-left whitespace-nowrap" data-node-id="183:659">
              Request payout
            </p>
            <div className="relative shrink-0 size-[15px]" data-node-id="183:660" data-name="Icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </a>
        </div>
        <div className="relative shrink-0 size-[10px]" data-node-id="183:662" data-name="Gap" />
        <div className="content-stretch flex gap-[18px] items-center overflow-clip relative shrink-0" data-node-id="183:663" data-name="Frame">
          <div className="content-stretch flex gap-[7px] items-center overflow-clip relative shrink-0" data-node-id="183:664" data-name="Frame">
            <div className="relative shrink-0 size-[6px]" data-node-id="183:665" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="183:666">
              <span className="font-[family-name:var(--font-bengali)] leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                ৳
              </span>
              <span className="leading-[21px]">25,600</span>
            </p>
            <p className="[word-break:break-word]  font-normal leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:667">
              in review
            </p>
          </div>
          <div className="content-stretch flex gap-[7px] items-center overflow-clip relative shrink-0" data-node-id="183:668" data-name="Frame">
            <div className="relative shrink-0 size-[6px]" data-node-id="183:669" data-name="Ellipse">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse1} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="183:670">
              <span className="font-[family-name:var(--font-bengali)] leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                ৳
              </span>
              <span className="leading-[21px]">1,500</span>
            </p>
            <p className="[word-break:break-word]  font-normal leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:671">
              paid out
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col gap-[16px] items-start overflow-clip pb-[28px] px-[24px] relative shrink-0 w-full" data-node-id="183:672" data-name="Earnings">
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="183:673" data-name="Hairline" />
        <div className="h-[4px] relative shrink-0 w-[10px]" data-node-id="183:674" data-name="Gap" />
        <div className="content-stretch flex items-end overflow-clip relative shrink-0 w-full" data-node-id="183:675" data-name="Frame">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px overflow-clip relative" data-node-id="183:676" data-name="Frame">
            <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="183:677" data-name="Frame">
              <div className="bg-[var(--color-bg-accent,#ea6d28)] h-[12px] relative shrink-0 w-[3px]" data-node-id="183:678" data-name="Rectangle" />
              <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-accent,#c4531a)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="183:679">
                EARNED SINCE JULY
              </p>
            </div>
            <p className="[word-break:break-word]  font-extrabold leading-[0] relative shrink-0 text-[26px] text-[color:var(--color-text-primary,#1a1832)] tracking-[-0.52px] whitespace-nowrap" data-node-id="183:680">
              <span className="font-[family-name:var(--font-bengali)] font-bold leading-[32px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                ৳
              </span>
              <span className="leading-[32px]">3,600</span>
            </p>
          </div>
          <div className="bg-[var(--color-bg-success,#e8f6ee)] content-stretch flex items-center overflow-clip pl-[8px] pr-[10px] py-[4px] relative rounded-[999px] shrink-0" data-node-id="183:681" data-name="Frame">
            <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-success,#15803d)] whitespace-nowrap" data-node-id="183:682">
              12 verified leads
            </p>
          </div>
        </div>
        <div className="content-stretch flex gap-[10px] items-end overflow-clip relative shrink-0 w-full" data-node-id="183:683" data-name="Chart">
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px overflow-clip relative" data-node-id="183:684" data-name="Frame">
            <p className="[word-break:break-word] font-[family-name:var(--font-bengali)] font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:685" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳300
            </p>
            <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.85))] h-[32px] relative rounded-bl-[2px] rounded-br-[2px] rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full" data-node-id="183:686" data-name="Rectangle" />
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:687">
              Jul
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px overflow-clip relative" data-node-id="183:688" data-name="Frame">
            <p className="[word-break:break-word] font-[family-name:var(--font-bengali)] font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:689" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳600
            </p>
            <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.85))] h-[64px] relative rounded-bl-[2px] rounded-br-[2px] rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full" data-node-id="183:690" data-name="Rectangle" />
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:691">
              Aug
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px overflow-clip relative" data-node-id="183:692" data-name="Frame">
            <p className="[word-break:break-word] font-[family-name:var(--font-bengali)] font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:693" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳600
            </p>
            <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.85))] h-[64px] relative rounded-bl-[2px] rounded-br-[2px] rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full" data-node-id="183:694" data-name="Rectangle" />
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:695">
              Sep
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px overflow-clip relative" data-node-id="183:696" data-name="Frame">
            <p className="[word-break:break-word] font-[family-name:var(--font-bengali)] font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:697" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳900
            </p>
            <div className="bg-[var(--color-bg-brand,rgba(40,50,112,0.85))] h-[96px] relative rounded-bl-[2px] rounded-br-[2px] rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full" data-node-id="183:698" data-name="Rectangle" />
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:699">
              Oct
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px overflow-clip relative" data-node-id="183:700" data-name="Frame">
            <p className="[word-break:break-word] font-[family-name:var(--font-bengali)] font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:701" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳900
            </p>
            <div className="bg-[var(--color-bg-brand,#283270)] h-[96px] relative rounded-bl-[2px] rounded-br-[2px] rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full" data-node-id="183:702" data-name="Rectangle" />
            <p className="[word-break:break-word]  font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)] whitespace-nowrap" data-node-id="183:703">
              Nov
            </p>
          </div>
          <div className="content-stretch flex flex-[1_0_0] flex-col gap-[6px] items-center min-w-px overflow-clip relative" data-node-id="183:704" data-name="Frame">
            <p className="[word-break:break-word] font-[family-name:var(--font-bengali)] font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-accent,#c4531a)] whitespace-nowrap" data-node-id="183:705" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳300
            </p>
            <div className="bg-[var(--color-bg-accent,#ea6d28)] h-[32px] relative rounded-bl-[2px] rounded-br-[2px] rounded-tl-[6px] rounded-tr-[6px] shrink-0 w-full" data-node-id="183:706" data-name="Rectangle" />
            <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="183:707">
              Dec
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-surface,white)] border border-[var(--color-border-default,#e5e2eb)] border-solid content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[14px] relative rounded-[16px] shrink-0 w-full" data-node-id="183:708" data-name="Next unlock">
          <div className="bg-[var(--color-bg-accent-soft,#fef2ea)] content-stretch flex items-center justify-center overflow-clip relative rounded-[12px] shrink-0 size-[36px]" data-node-id="183:709" data-name="Frame">
            <div className="relative shrink-0 size-[16.2px]" data-node-id="183:710" data-name="Icon/graduation-cap">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconGraduationCap} />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-w-px overflow-clip relative" data-node-id="183:713" data-name="Frame">
            <p className=" font-semibold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="183:714">
              <span className="leading-[21px]">{`Next unlock · `}</span>
              <span className="font-[family-name:var(--font-bengali)] font-bold leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                ৳
              </span>
              <span className="leading-[21px]">25,000</span>
            </p>
            <p className=" font-normal leading-[17px] min-w-full relative shrink-0 text-[12px] text-[color:var(--color-text-secondary,#6b6882)] w-[min-content]" data-node-id="183:715">
              When Nabila’s enrolment is verified, usually 5–7 days
            </p>
          </div>
        </div>
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip pb-[28px] px-[24px] relative shrink-0 w-full" data-node-id="183:716" data-name="Payout method">
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="183:717" data-name="Hairline" />
        <div className="content-stretch flex gap-[12px] items-center overflow-clip py-[16px] relative shrink-0 w-full" data-node-id="183:718" data-name="Frame">
          <div className="bg-[var(--color-bg-bkash,#e2136e)] content-stretch flex items-center justify-center overflow-clip relative rounded-[12px] shrink-0 size-[40px]" data-node-id="183:719" data-name="Frame">
            <div className="relative shrink-0 size-[18px]" data-node-id="183:720" data-name="Icon/phone">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPhone} />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="183:723" data-name="Frame">
            <p className=" font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)]" data-node-id="183:724">
              bKash · 01712-•••678
            </p>
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="183:725">
              Default · arrives within 24 hours
            </p>
          </div>
          <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] whitespace-nowrap" data-node-id="183:726">
            Change
          </p>
        </div>
        <div className="bg-[var(--color-border-default,#e5e2eb)] h-px relative shrink-0 w-full" data-node-id="183:727" data-name="Hairline" />
      </div>
      <div className="content-stretch flex flex-col items-start overflow-clip px-[24px] relative shrink-0 w-full" data-node-id="183:728" data-name="Activity">
        <div className="content-stretch flex items-center overflow-clip pb-[4px] relative shrink-0 w-full" data-node-id="183:729" data-name="Frame">
          <div className="content-stretch flex gap-[8px] items-center overflow-clip relative shrink-0" data-node-id="183:730" data-name="Frame">
            <div className="bg-[var(--color-bg-accent,#ea6d28)] h-[12px] relative shrink-0 w-[3px]" data-node-id="183:731" data-name="Rectangle" />
            <p className="[word-break:break-word]  font-semibold leading-[14px] relative shrink-0 text-[11px] text-[color:var(--color-text-accent,#c4531a)] tracking-[0.6px] uppercase whitespace-nowrap" data-node-id="183:732">
              ACTIVITY
            </p>
          </div>
          <div className="flex-[1_0_0] h-px min-w-px relative" data-node-id="183:733" data-name="Frame" />
          <p className="[word-break:break-word]  font-bold leading-[18px] relative shrink-0 text-[13px] text-[color:var(--color-text-brand,#323d86)] whitespace-nowrap" data-node-id="183:734">
            See all
          </p>
        </div>
        <div className="content-stretch flex gap-[12px] items-center overflow-clip py-[12px] relative shrink-0 w-full" data-node-id="183:735" data-name="Frame">
          <div className="bg-[var(--color-bg-brand-tint,#e6e8f4)] content-stretch flex items-center justify-center overflow-clip relative rounded-[12px] shrink-0 size-[36px]" data-node-id="183:736" data-name="Frame">
            <div className="relative shrink-0 size-[16.2px]" data-node-id="183:737" data-name="Icon/users">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconUsers} />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="183:742" data-name="Frame">
            <p className=" font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)]" data-node-id="183:743">
              Farhan Kabir · verified lead
            </p>
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="183:744">
              3 Dec · Northbridge
            </p>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-success,#15803d)] whitespace-nowrap" data-node-id="183:745">
            <span className="leading-[21px]">+</span>
            <span className="font-[family-name:var(--font-bengali)] font-bold leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳
            </span>
            <span className="leading-[21px]">300</span>
          </p>
        </div>
        <div className="content-stretch flex gap-[12px] items-center overflow-clip py-[12px] relative shrink-0 w-full" data-node-id="183:746" data-name="Frame">
          <div className="bg-[var(--color-bg-brand-tint,#e6e8f4)] content-stretch flex items-center justify-center overflow-clip relative rounded-[12px] shrink-0 size-[36px]" data-node-id="183:747" data-name="Frame">
            <div className="relative shrink-0 size-[16.2px]" data-node-id="183:748" data-name="Icon/users">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconUsers} />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="183:753" data-name="Frame">
            <p className=" font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)]" data-node-id="183:754">
              Rafiul Islam · verified lead
            </p>
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="183:755">
              25 Nov · Northbridge
            </p>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-success,#15803d)] whitespace-nowrap" data-node-id="183:756">
            <span className="leading-[21px]">+</span>
            <span className="font-[family-name:var(--font-bengali)] font-bold leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳
            </span>
            <span className="leading-[21px]">300</span>
          </p>
        </div>
        <div className="content-stretch flex gap-[12px] items-center overflow-clip py-[12px] relative shrink-0 w-full" data-node-id="183:757" data-name="Frame">
          <div className="bg-[var(--color-bg-bkash,#e2136e)] content-stretch flex items-center justify-center overflow-clip relative rounded-[12px] shrink-0 size-[36px]" data-node-id="183:758" data-name="Frame">
            <div className="relative shrink-0 size-[16.2px]" data-node-id="183:759" data-name="Icon/phone">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPhone1} />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="183:762" data-name="Frame">
            <p className=" font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)]" data-node-id="183:763">
              Payout to bKash
            </p>
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="183:764">
              2 Nov · REQ-10431 · paid manually
            </p>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)] whitespace-nowrap" data-node-id="183:765">
            <span className="leading-[21px]">−</span>
            <span className="font-[family-name:var(--font-bengali)] font-bold leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳
            </span>
            <span className="leading-[21px]">1,500</span>
          </p>
        </div>
        <div className="content-stretch flex gap-[12px] items-center overflow-clip py-[12px] relative shrink-0 w-full" data-node-id="183:766" data-name="Frame">
          <div className="bg-[var(--color-bg-brand-tint,#e6e8f4)] content-stretch flex items-center justify-center overflow-clip relative rounded-[12px] shrink-0 size-[36px]" data-node-id="183:767" data-name="Frame">
            <div className="relative shrink-0 size-[16.2px]" data-node-id="183:768" data-name="Icon/users">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconUsers} />
            </div>
          </div>
          <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-w-px overflow-clip relative whitespace-nowrap" data-node-id="183:773" data-name="Frame">
            <p className=" font-semibold leading-[21px] relative shrink-0 text-[14px] text-[color:var(--color-text-primary,#1a1832)]" data-node-id="183:774">
              Tasnia Rahman · verified lead
            </p>
            <p className=" font-normal leading-[17px] relative shrink-0 text-[12px] text-[color:var(--color-text-tertiary,#9895aa)]" data-node-id="183:775">
              18 Oct · Northbridge
            </p>
          </div>
          <p className="[word-break:break-word]  font-extrabold leading-[0] relative shrink-0 text-[14px] text-[color:var(--color-text-success,#15803d)] whitespace-nowrap" data-node-id="183:776">
            <span className="leading-[21px]">+</span>
            <span className="font-[family-name:var(--font-bengali)] font-bold leading-[21px]" style={{ fontVariationSettings: '"wdth" 100' }}>
              ৳
            </span>
            <span className="leading-[21px]">300</span>
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 h-[90px] left-0 right-0" data-node-id="200:7675" data-name="Tab Bar">
        <div className="absolute backdrop-blur-[12px] bg-[var(--surface\/glass,rgba(255,255,255,0.82))] border border-[rgba(255,255,255,0.55)] border-solid content-stretch drop-shadow-[0px_10px_15px_rgba(13,15,38,0.14)] flex items-start left-[20px] p-[6px] rounded-[34px] top-[4px]" data-node-id="I200:7675;194:8108" data-name="Glass Pill">
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7675;194:8109" data-name="Tab/Home">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7675;198:629" data-name="Icon/home">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconHome} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7675;194:8111">
              Home
            </p>
          </a>
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7675;194:8112" data-name="Tab/Referrals">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7675;198:631" data-name="Icon/referrals">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconReferrals} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7675;194:8114">
              Referrals
            </p>
          </a>
          <div className="content-stretch flex flex-col gap-[8px] h-[56px] items-center justify-center relative shrink-0 w-[69.6px]" data-node-id="I200:7675;215:10223" data-name="Tab/Refer">
            <div className="-translate-x-1/2 absolute border-4 border-solid border-white content-stretch flex items-center justify-center left-1/2 overflow-clip rounded-[30px] shadow-[0px_8px_18px_0px_rgba(235,110,41,0.4)] size-[60px] top-[-34px]" data-node-id="I200:7675;215:10224" style={{ backgroundImage: "linear-gradient(135deg, rgb(250, 148, 77) 0%, rgb(227, 92, 26) 71.429%)" }} data-name="Refer button">
              <div className="relative shrink-0 size-[28px]" data-node-id="I200:7675;215:10225" data-name="Icon/plus">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPlus} />
              </div>
            </div>
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7675;215:10226" data-name="Icon slot" />
            <p className="[word-break:break-word]  font-bold leading-[12px] relative shrink-0 text-[#ea6d28] text-[11px] whitespace-nowrap" data-node-id="I200:7675;215:10227">
              Refer
            </p>
          </div>
          <div className="bg-[#dbdded] content-stretch flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7675;194:8115" data-name="Tab/Wallet">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7675;198:636" data-name="Icon/wallet">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconWallet} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[12px] relative shrink-0 text-[#283270] text-[11px] tracking-[0.1px] whitespace-nowrap" data-node-id="I200:7675;194:8117">
              Wallet
            </p>
          </div>
          <a className="content-stretch cursor-pointer flex flex-col gap-[3px] h-[56px] items-center justify-center overflow-clip relative rounded-[28px] shrink-0 w-[69.6px]" data-node-id="I200:7675;194:8118" data-name="Tab/Profile">
            <div className="relative shrink-0 size-[24px]" data-node-id="I200:7675;198:640" data-name="Icon/profile">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconProfile} />
            </div>
            <p className="[word-break:break-word]  font-medium leading-[12px] relative shrink-0 text-[#4a4d66] text-[11px] text-left whitespace-nowrap" data-node-id="I200:7675;194:8120">
              Profile
            </p>
          </a>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute bg-[var(--color-text-primary,#1a1832)] bottom-[8px] h-[5px] left-1/2 rounded-[3px] w-[134px]" data-node-id="183:839" data-name="Home Indicator" />
    </div>
  );
}
