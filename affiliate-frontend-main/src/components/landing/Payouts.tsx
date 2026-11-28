// Layout and local assets adapted from the supplied Figma design.
const imgIconPhone = "/landing/8c8fdbca-6daa-4278-b6d6-1e85fbc93db0.svg";
const imgIconBank = "/landing/1a7969e6-7c10-42eb-94a2-9d23ff16d46d.svg";
const imgEllipse = "/landing/d6408c31-1627-48aa-ac95-a4885fb00743.svg";
const imgIconPhone1 = "/landing/c6e67b5d-2d67-4909-b666-26cf9b77d0c1.svg";
const imgIconCheck = "/landing/f52b0ef0-dbdf-4dbc-8064-2a285fd390c9.svg";
const imgIconDownload = "/landing/5f064218-aa46-4fbc-9e1d-9fb24bf31046.svg";

export default function Payouts() {
  return (
    <div className="bg-white content-stretch flex gap-[80px] items-center px-[120px] py-[80px] relative size-full" data-node-id="296:587" data-name="Payouts">
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-start min-w-px relative" data-node-id="296:588" data-name="Frame">
        <h2 className="[word-break:break-word]  font-extrabold leading-[52px] min-w-full relative shrink-0 text-[#292c43] text-[44px] tracking-[-1.1px] w-[min-content]" data-node-id="296:590">
          Withdraw to bKash or your bank.
        </h2>
        <p className="[word-break:break-word]  font-medium leading-[26px] min-w-full relative shrink-0 text-[#5e5a6b] text-[17px] w-[min-content]" data-node-id="296:591">
          Request a payout whenever you like. Our finance team reviews it and sends the money manually. You get the transaction ID and receipt right in your portal.
        </p>
        <div className="content-stretch flex flex-col items-start pt-[16px] relative shrink-0 w-full" data-node-id="296:592" data-name="Frame">
          <div className="border-[#e8e5e0] border-b border-solid content-stretch flex gap-[16px] items-start py-[14px] relative shrink-0 w-full" data-node-id="296:593" data-name="Frame">
            <div className="bg-[#efecf3] content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[32px]" data-node-id="296:594" data-name="Frame">
              <p className="[word-break:break-word]  font-extrabold leading-[20px] relative shrink-0 text-[#293171] text-[14px] whitespace-nowrap" data-node-id="296:595">
                1
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px relative whitespace-nowrap" data-node-id="296:596" data-name="Frame">
              <p className=" font-extrabold leading-[22px] relative shrink-0 text-[#292c43] text-[16px]" data-node-id="296:597">
                Request a payout
              </p>
              <p className=" font-medium leading-[20px] relative shrink-0 text-[#5e5a6b] text-[14px]" data-node-id="296:598">
                Choose bKash or bank and enter the amount.
              </p>
            </div>
          </div>
          <div className="border-[#e8e5e0] border-b border-solid content-stretch flex gap-[16px] items-start py-[14px] relative shrink-0 w-full" data-node-id="296:599" data-name="Frame">
            <div className="bg-[#efecf3] content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[32px]" data-node-id="296:600" data-name="Frame">
              <p className="[word-break:break-word]  font-extrabold leading-[20px] relative shrink-0 text-[#293171] text-[14px] whitespace-nowrap" data-node-id="296:601">
                2
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px relative whitespace-nowrap" data-node-id="296:602" data-name="Frame">
              <p className=" font-extrabold leading-[22px] relative shrink-0 text-[#292c43] text-[16px]" data-node-id="296:603">
                Admin review
              </p>
              <p className=" font-medium leading-[20px] relative shrink-0 text-[#5e5a6b] text-[14px]" data-node-id="296:604">
                Our team checks the request and approves it.
              </p>
            </div>
          </div>
          <div className="content-stretch flex gap-[16px] items-start py-[14px] relative shrink-0 w-full" data-node-id="296:605" data-name="Frame">
            <div className="bg-[#efecf3] content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[32px]" data-node-id="296:606" data-name="Frame">
              <p className="[word-break:break-word]  font-extrabold leading-[20px] relative shrink-0 text-[#293171] text-[14px] whitespace-nowrap" data-node-id="296:607">
                3
              </p>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px relative whitespace-nowrap" data-node-id="296:608" data-name="Frame">
              <p className=" font-extrabold leading-[22px] relative shrink-0 text-[#292c43] text-[16px]" data-node-id="296:609">
                Paid with proof
              </p>
              <p className=" font-medium leading-[20px] relative shrink-0 text-[#5e5a6b] text-[14px]" data-node-id="296:610">
                Money is sent with a TrxID and downloadable receipt.
              </p>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[10px] items-start pt-[12px] relative shrink-0" data-node-id="296:611" data-name="Frame">
          <div className="border border-[#e8e5e0] border-solid content-stretch flex gap-[8px] items-center pl-[12px] pr-[14px] py-[9px] relative rounded-[8px] shrink-0" data-node-id="296:612" data-name="Frame">
            <div className="relative shrink-0 size-[16px]" data-node-id="296:613" data-name="Icon/phone">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPhone} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[20px] relative shrink-0 text-[#292c43] text-[14px] whitespace-nowrap" data-node-id="296:616">
              bKash
            </p>
          </div>
          <div className="border border-[#e8e5e0] border-solid content-stretch flex gap-[8px] items-center pl-[12px] pr-[14px] py-[9px] relative rounded-[8px] shrink-0" data-node-id="296:617" data-name="Frame">
            <div className="relative shrink-0 size-[16px]" data-node-id="296:618" data-name="Icon/bank">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconBank} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[20px] relative shrink-0 text-[#292c43] text-[14px] whitespace-nowrap" data-node-id="296:621">
              Bank transfer
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#faf8f6] content-stretch flex flex-col h-[80px] items-center p-[40px] relative rounded-[16px] shrink-0 w-[560px]" data-node-id="296:622" data-name="Payout visual">
        <div className="bg-white content-stretch drop-shadow-[0px_16px_20px_rgba(13,15,51,0.1)] flex flex-col gap-[18px] items-start p-[28px] relative rounded-[12px] shrink-0 w-full" data-node-id="296:623" data-hover-card="true" data-name="Payout status card">
          <div className="content-stretch flex items-center relative shrink-0 w-full" data-node-id="296:624" data-name="Frame">
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-start min-w-px relative whitespace-nowrap" data-node-id="296:625" data-name="Frame">
              <p className=" font-semibold leading-[18px] relative shrink-0 text-[#5e5a6b] text-[13px]" data-node-id="296:626">
                Payout request · PR-1042
              </p>
              <p className=" font-extrabold leading-[0] relative shrink-0 text-[#292c43] text-[36px] tracking-[-0.72px]" data-node-id="296:627">
                <span className="font-[family-name:var(--font-bengali)] leading-[42px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  ৳
                </span>
                <span className="leading-[42px]">2,100</span>
              </p>
            </div>
            <div className="bg-[#e3f4ec] content-stretch flex gap-[6px] items-center px-[10px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="296:628" data-name="Frame">
              <div className="relative shrink-0 size-[6px]" data-node-id="296:629" data-name="Ellipse">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
              </div>
              <p className="[word-break:break-word]  font-bold leading-[17px] relative shrink-0 text-[#1f9d6b] text-[12px] whitespace-nowrap" data-node-id="296:630">
                Paid
              </p>
            </div>
          </div>
          <div className="bg-[#faf8f6] content-stretch flex gap-[12px] items-center px-[14px] py-[12px] relative rounded-[8px] shrink-0 w-full" data-node-id="296:631" data-name="Frame">
            <div className="bg-[#fce4ef] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[34px]" data-node-id="296:632" data-name="Frame">
              <div className="relative shrink-0 size-[17px]" data-node-id="296:633" data-name="Icon/phone">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconPhone1} />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-w-px relative whitespace-nowrap" data-node-id="296:636" data-name="Frame">
              <p className=" font-bold leading-[20px] relative shrink-0 text-[#292c43] text-[14px]" data-node-id="296:637">
                bKash · Personal
              </p>
              <p className=" font-medium leading-[18px] relative shrink-0 text-[#5e5a6b] text-[13px]" data-node-id="296:638">
                01712 ••• 678
              </p>
            </div>
          </div>
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-node-id="296:639" data-name="Frame">
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="296:640" data-name="Frame">
              <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="296:641" data-name="Frame">
                <div className="bg-[#1f9d6b] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[20px]" data-node-id="296:642" data-name="Frame">
                  <div className="relative shrink-0 size-[12px]" data-node-id="296:643" data-name="Icon/check">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
                  </div>
                </div>
                <div className="bg-[rgba(31,157,107,0.35)] h-[22px] relative shrink-0 w-[2px]" data-node-id="296:645" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0]  font-bold leading-[20px] min-w-px relative text-[#292c43] text-[14px]" data-node-id="296:646">
                Requested
              </p>
              <p className="[word-break:break-word]  font-medium leading-[18px] relative shrink-0 text-[#918b99] text-[13px] whitespace-nowrap" data-node-id="296:647">
                24 Nov, 10:12 AM
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="296:648" data-name="Frame">
              <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="296:649" data-name="Frame">
                <div className="bg-[#1f9d6b] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[20px]" data-node-id="296:650" data-name="Frame">
                  <div className="relative shrink-0 size-[12px]" data-node-id="296:651" data-name="Icon/check">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
                  </div>
                </div>
                <div className="bg-[rgba(31,157,107,0.35)] h-[22px] relative shrink-0 w-[2px]" data-node-id="296:653" data-name="Rectangle" />
              </div>
              <p className="[word-break:break-word] flex-[1_0_0]  font-bold leading-[20px] min-w-px relative text-[#292c43] text-[14px]" data-node-id="296:654">
                Approved by admin
              </p>
              <p className="[word-break:break-word]  font-medium leading-[18px] relative shrink-0 text-[#918b99] text-[13px] whitespace-nowrap" data-node-id="296:655">
                24 Nov, 3:40 PM
              </p>
            </div>
            <div className="content-stretch flex gap-[12px] items-start relative shrink-0 w-full" data-node-id="296:656" data-name="Frame">
              <div className="content-stretch flex flex-col items-center relative shrink-0" data-node-id="296:657" data-name="Frame">
                <div className="bg-[#1f9d6b] content-stretch flex items-center justify-center relative rounded-[10px] shrink-0 size-[20px]" data-node-id="296:658" data-name="Frame">
                  <div className="relative shrink-0 size-[12px]" data-node-id="296:659" data-name="Icon/check">
                    <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
                  </div>
                </div>
              </div>
              <p className="[word-break:break-word] flex-[1_0_0]  font-bold leading-[20px] min-w-px relative text-[#292c43] text-[14px]" data-node-id="296:661">
                Paid · TrxID 9F7K2L
              </p>
              <p className="[word-break:break-word]  font-medium leading-[18px] relative shrink-0 text-[#918b99] text-[13px] whitespace-nowrap" data-node-id="296:662">
                25 Nov, 11:05 AM
              </p>
            </div>
          </div>
          <div className="border border-[#e8e5e0] border-solid content-stretch flex gap-[8px] items-center justify-center py-[11px] relative rounded-[8px] shrink-0 w-full" data-node-id="296:663" data-name="Frame">
            <div className="relative shrink-0 size-[16px]" data-node-id="296:664" data-name="Icon/download">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconDownload} />
            </div>
            <p className="[word-break:break-word]  font-bold leading-[20px] relative shrink-0 text-[#293171] text-[14px] whitespace-nowrap" data-node-id="296:666">
              Download receipt
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
