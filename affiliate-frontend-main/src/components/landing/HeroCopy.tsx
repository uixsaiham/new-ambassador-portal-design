import Image from "next/image";
// Layout and local assets adapted from the supplied Figma design.
const imgEllipse = "/landing/2931b64f-e2c7-498f-ab5a-ad8d2f0d3c0a.svg";
const imgIconArrowRight = "/landing/91b789e4-2b20-499c-b86b-606f396caa27.svg";
const imgIconCheck = "/landing/a5b02aae-f329-417b-9c6f-410f4a4ca0ac.svg";

export default function HeroCopy() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center pb-[56px] pt-[72px] relative size-full" data-node-id="293:3945" data-name="Hero copy">
      <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.16)] border-solid content-stretch flex gap-[10px] items-center pl-[14px] pr-[5px] py-[5px] relative rounded-[999px] shrink-0" data-node-id="293:3946" data-name="Frame">
        <div className="relative shrink-0 size-[7px]" data-node-id="305:865" data-name="Ellipse">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
        </div>
        <p className="[word-break:break-word]  font-extrabold leading-[normal] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.82)] tracking-[1.2px] whitespace-nowrap" data-node-id="305:866">
          THE BHE UNI AMBASSADOR COMMUNITY
        </p>
        <div className="bg-[#fdede4] content-stretch flex items-center overflow-clip px-[10px] py-[4px] relative rounded-[999px] shrink-0" data-node-id="305:867" data-name="Frame">
          <p className="[word-break:break-word]  font-bold leading-[normal] relative shrink-0 text-[#c2471a] text-[12px] whitespace-nowrap" data-node-id="305:868">
            Your next chapter ↗
          </p>
        </div>
      </div>
      <h1 className="[word-break:break-word]  font-extrabold leading-[0] relative shrink-0 text-[76px] text-center text-white tracking-[-2.66px] w-[1100px]" data-node-id="293:3950">
        <span className="leading-[82px] mb-0">Your connections.</span>
        <span>
          <span className="leading-[82px]">{`Their future. `}</span>
          <span className="leading-[82px] text-[#f26925]">Your rewards.</span>
        </span>
      </h1>
      <p className="[word-break:break-word]  font-medium leading-[28px] relative shrink-0 text-[18px] text-[rgba(255,255,255,0.72)] text-center w-[640px]" data-node-id="293:3951">
        Share your link, track every referral from lead to enrolment, and withdraw your rewards to bKash or your bank, all from one simple portal.
      </p>
      <div className="content-stretch flex gap-[12px] items-start pt-[8px] relative shrink-0" data-node-id="293:3952" data-name="Frame">
        <a href="/signup" className="bg-white content-stretch flex gap-[8px] items-center px-[22px] py-[15px] relative rounded-[8px] shrink-0" data-node-id="293:3953" data-name="Button · Continue with Google">
          <div className="content-stretch flex items-center justify-center relative rounded-[9px] shrink-0 size-[18px]" data-node-id="293:3954" data-name="Frame">
            <Image src="/landing/google-g.png" alt="" width={18} height={18} unoptimized style={{ flexShrink: 0 }} />
          </div>
          <p className="[word-break:break-word]  font-bold leading-[21px] relative shrink-0 text-[#292c43] text-[15px] whitespace-nowrap" data-node-id="293:3956">
            Continue with Google
          </p>
        </a>
        <a href="/signup" className="border border-[rgba(255,255,255,0.35)] border-solid content-stretch flex gap-[8px] items-center px-[22px] py-[15px] relative rounded-[8px] shrink-0" data-node-id="293:3957" data-name="Button · Sign up with email">
          <p className="[word-break:break-word]  font-bold leading-[21px] relative shrink-0 text-[15px] text-white whitespace-nowrap" data-node-id="293:3958">
            Sign up with email
          </p>
          <div className="relative shrink-0 size-[16px]" data-node-id="293:3959" data-name="Icon/arrow-right">
            <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
          </div>
        </a>
      </div>
      <div className="content-stretch flex gap-[24px] items-center relative shrink-0" data-node-id="293:3961" data-name="Frame">
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="293:3962" data-name="Frame">
          <div className="bg-[#1f9d6b] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[16px]" data-node-id="293:3963" data-name="Frame">
            <div className="relative shrink-0 size-[10px]" data-node-id="293:3964" data-name="Icon/check">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-semibold leading-[18px] relative shrink-0 text-[13px] text-[rgba(255,255,255,0.75)] whitespace-nowrap" data-node-id="293:3966">
            Free to join
          </p>
        </div>
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="293:3967" data-name="Frame">
          <div className="bg-[#1f9d6b] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[16px]" data-node-id="293:3968" data-name="Frame">
            <div className="relative shrink-0 size-[10px]" data-node-id="293:3969" data-name="Icon/check">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-semibold leading-[18px] relative shrink-0 text-[13px] text-[rgba(255,255,255,0.75)] whitespace-nowrap" data-node-id="293:3971">
            Paid via bKash or bank
          </p>
        </div>
        <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="293:3972" data-name="Frame">
          <div className="bg-[#1f9d6b] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[16px]" data-node-id="293:3973" data-name="Frame">
            <div className="relative shrink-0 size-[10px]" data-node-id="293:3974" data-name="Icon/check">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconCheck} />
            </div>
          </div>
          <p className="[word-break:break-word]  font-semibold leading-[18px] relative shrink-0 text-[13px] text-[rgba(255,255,255,0.75)] whitespace-nowrap" data-node-id="293:3976">
            No sales targets
          </p>
        </div>
      </div>
    </div>
  );
}
